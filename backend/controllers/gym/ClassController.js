import {
  Class_Enrollment,
  Class_Session,
  Class_Type,
  Membership,
  Membership_Type,
} from "../../models/index.js";
import { getSessionStatus } from "../../utils/sessionStatus.js";
import { db } from "../../config/db.js";
import {
  hasManagedGymAccess,
  hasGymMembershipAccess,
} from "../../utils/access.js";
import { isAttendanceWindowOpen } from "../../utils/dateUtils.js";
import { syncExpiredNoShows } from "../../utils/syncNoShow.js";
import { Op } from "sequelize";

const promoteFromWaitingList = async (sessionId, transaction) => {
  const next = await Class_Enrollment.findOne({
    where: {
      session_id: sessionId,
      status: "waiting_list",
    },
    order: [["enrollment_date", "ASC"]],
    transaction,
  });

  if (next) {
    next.status = "confirmed";
    await next.save({ transaction });
  }
};

export const controller = {
  enrollInSession: async (req, res) => {
    let t;

    try {
      const { sessionId } = req.params;
      const clientId = req.user.user_id;

      t = await db.transaction();

      const session = await Class_Session.findByPk(sessionId, {
        include: [{ model: Class_Type }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!session) {
        await t.rollback();
        return res.status(404).send("Session not found");
      }

      if (session.status === "cancelled") {
        await t.rollback();
        return res.status(400).send("Session cancelled");
      }

      const computedStatus = getSessionStatus(session);

      if (computedStatus !== "scheduled") {
        await t.rollback();
        return res.status(400).send("Session is not open for enrollment");
      }

      if (!hasGymMembershipAccess(req.user, session.gym_id)) {
        await t.rollback();
        return res.status(403).send("Session belongs to another gym");
      }

      const activeMembership = await Membership.findOne({
        where: {
          client_id: clientId,
          status: "active",
        },
        include: [
          {
            model: Membership_Type,
            where: { gym_id: session.gym_id },
            attributes: ["includes_group_classes"],
          },
        ],
        transaction: t,
      });

      if (!activeMembership) {
        await t.rollback();
        return res.status(403).send("No active membership");
      }

      if (!activeMembership.Membership_Type.includes_group_classes) {
        await t.rollback();
        return res
          .status(403)
          .send("Your membership does not include group classes");
      }

      await syncExpiredNoShows({ clientId, transaction: t });

      const noShowCount = await Class_Enrollment.count({
        where: {
          client_id: clientId,
          status: "no_show",
        },
        transaction: t,
      });

      if (noShowCount >= 3) {
        await t.rollback();
        return res.status(403).send("Booking blocked due to repeated no-shows");
      }

      const existingEnrollment = await Class_Enrollment.findOne({
        where: {
          session_id: sessionId,
          client_id: clientId,
          status: {
            [Op.in]: ["confirmed", "waiting_list"],
          },
        },
        transaction: t,
      });

      if (existingEnrollment) {
        await t.rollback();
        return res.status(400).send("Already enrolled");
      }

      const overlapping = await Class_Enrollment.findOne({
        where: {
          client_id: clientId,
          status: "confirmed",
        },
        include: [
          {
            model: Class_Session,
            required: true,
            where: {
              start_datetime: { [Op.lt]: session.end_datetime },
              end_datetime: { [Op.gt]: session.start_datetime },
            },
          },
        ],
        transaction: t,
      });

      if (overlapping) {
        await t.rollback();
        return res.status(400).send("Overlapping class");
      }

      const confirmedCount = await Class_Enrollment.count({
        where: {
          session_id: sessionId,
          status: "confirmed",
        },
        transaction: t,
      });

      let status = "confirmed";

      if (confirmedCount >= session.Class_Type.max_participants) {
        status = "waiting_list";
      }

      const enrollment = await Class_Enrollment.create(
        {
          session_id: sessionId,
          client_id: clientId,
          status,
        },
        { transaction: t },
      );
      let waitingPosition = null;

      if (status === "waiting_list") {
        const waitingCount = await Class_Enrollment.count({
          where: {
            session_id: sessionId,
            status: "waiting_list",
            enrollment_date: {
              [Op.lt]: enrollment.enrollment_date,
            },
          },
          transaction: t,
        });

        waitingPosition = waitingCount + 1;
      }

      await t.commit();

      return res.status(201).json({
        enrollment,
        waiting_position: waitingPosition,
        message:
          status === "confirmed"
            ? "Successfully enrolled"
            : `Class is full. You are ${waitingPosition} on the waiting list`,
      });
    } catch (err) {
      if (t) await t.rollback();
      return res.status(500).send(err.message);
    }
  },

  cancelEnrollment: async (req, res) => {
    let t;
    try {
      const { sessionId } = req.params;
      const clientId = req.user.user_id;

      t = await db.transaction();

      const enrollment = await Class_Enrollment.findOne({
        where: {
          session_id: sessionId,
          client_id: clientId,
          status: { [Op.in]: ["confirmed", "waiting_list"] },
        },
        transaction: t,
      });

      if (!enrollment) {
        await t.rollback();
        return res.status(404).send("Enrollment not found");
      }

      const session = await Class_Session.findByPk(sessionId, {
        transaction: t,
      });
      if (!session) {
        await t.rollback();
        return res.status(404).send("Session not found");
      }

      const computedStatus = getSessionStatus(session);
      if (computedStatus !== "scheduled") {
        await t.rollback();
        return res
          .status(400)
          .send("You can only cancel before the session starts");
      }

      const previousStatus = enrollment.status;

      await enrollment.update({ status: "cancelled" }, { transaction: t });
      if (previousStatus === "confirmed") {
        await promoteFromWaitingList(sessionId, t);
      }

      await t.commit();
      return res.status(200).send("Enrollment cancelled");
    } catch (err) {
      if (t) await t.rollback();
      return res
        .status(500)
        .send("Error cancelling enrollment: " + err.message);
    }
  },

  markAttendance: async (req, res) => {
    try {
      const { enrollmentId } = req.params;
      const { status } = req.body;

      if (!["attended", "no_show"].includes(status)) {
        return res.status(400).send("Invalid attendance status");
      }

      const enrollment = await Class_Enrollment.findByPk(enrollmentId, {
        include: [Class_Session],
      });

      if (!enrollment) {
        return res.status(404).send("Enrollment not found");
      }

      const session = enrollment.Class_Session;

      if (!isAttendanceWindowOpen(session)) {
        return res
          .status(400)
          .send("Attendance can only be marked near the session time");
      }

      const isTrainer = req.user.user_id === session.trainer_id;
      const isAdmin = await hasManagedGymAccess(req.user, session.gym_id);

      if (!isTrainer && !isAdmin) {
        return res.status(403).send("Not authorized");
      }

      enrollment.status = status;
      await enrollment.save();

      res.json(enrollment);
    } catch (err) {
      res.status(500).send(err.message);
    }
  },
};
