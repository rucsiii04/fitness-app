import {
  Class_Enrollment,
  Class_Session,
  Class_Type,
  Gym,
  Membership,
  Membership_Type,
  User,
} from "../../models/index.js";
import { getSessionStatus } from "../../utils/sessionStatus.js";
import { db } from "../../config/db.js";
import { hasManagedGymAccess } from "../../utils/access.js";
import { isAttendanceWindowOpen } from "../../utils/dateUtils.js";
import { syncExpiredNoShows } from "../../utils/syncNoShow.js";
import { Op } from "sequelize";

const promoteFromWaitingList = async (sessionId, transaction) => {
  const next = await Class_Enrollment.findOne({
    where: { session_id: sessionId, status: "waiting_list" },
    order: [["enrollment_date", "ASC"]],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!next) return;

  next.status = "confirmed";
  await next.save({ transaction });
};

export const controller = {
  enrollInSession: async (req, res) => {
    let t;

    try {
      const { sessionId } = req.params;
      const clientId = req.user.user_id;

      t = await db.transaction();

      const session = await Class_Session.findByPk(sessionId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!session) {
        await t.rollback();
        return res.status(404).json({ message: "Session not found" });
      }

      if (session.status === "cancelled") {
        await t.rollback();
        return res.status(400).json({ message: "Session cancelled" });
      }

      const computedStatus = getSessionStatus(session);

      if (computedStatus !== "scheduled") {
        await t.rollback();
        return res.status(400).json({ message: "Session is not open for enrollment" });
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
        return res.status(403).json({ message: "No active membership" });
      }

      if (!activeMembership.Membership_Type.includes_group_classes) {
        await t.rollback();
        return res
          .status(403)
          .json({ message: "Your membership does not include group classes" });
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
        return res.status(403).json({ message: "Booking blocked due to repeated no-shows" });
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
        return res.status(400).json({ message: "Already enrolled" });
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
        return res.status(400).json({ message: "Overlapping class" });
      }

      const confirmedEnrollments = await Class_Enrollment.findAll({
        where: {
          session_id: sessionId,
          status: "confirmed",
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const confirmedCount = confirmedEnrollments.length;

      let status = "confirmed";

      if (confirmedCount >= session.max_participants) {
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
      return res.status(500).json({ message: err.message });
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
        return res.status(404).json({ message: "Enrollment not found" });
      }

      const session = await Class_Session.findByPk(sessionId, {
        transaction: t,
      });
      if (!session) {
        await t.rollback();
        return res.status(404).json({ message: "Session not found" });
      }

      const computedStatus = getSessionStatus(session);
      if (computedStatus !== "scheduled") {
        await t.rollback();
        return res
          .status(400)
          .json({ message: "You can only cancel before the session starts" });
      }

      const previousStatus = enrollment.status;

      await enrollment.update({ status: "cancelled" }, { transaction: t });
      if (previousStatus === "confirmed") {
        await promoteFromWaitingList(sessionId, t);
      }

      await t.commit();
      return res.status(200).json({ message: "Enrollment cancelled" });
    } catch (err) {
      if (t) await t.rollback();
      return res
        .status(500)
        .json({ message: "Error cancelling enrollment: " + err.message });
    }
  },

  markAttendance: async (req, res) => {
    try {
      const { enrollmentId } = req.params;
      const { status } = req.body;

      if (!["attended", "no_show"].includes(status)) {
        return res.status(400).json({ message: "Invalid attendance status" });
      }

      const enrollment = await Class_Enrollment.findByPk(enrollmentId, {
        include: [Class_Session],
      });

      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      const session = enrollment.Class_Session;

      if (!isAttendanceWindowOpen(session)) {
        return res
          .status(400)
          .json({ message: "Attendance can only be marked near the session time" });
      }

      const isTrainer = req.user.user_id === session.trainer_id;
      const isAdmin = await hasManagedGymAccess(req.user, session.gym_id);

      if (!isTrainer && !isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      enrollment.status = status;
      await enrollment.save();

      res.json(enrollment);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  getClassTypesByGym: async (req, res) => {
    try {
      const { gymId } = req.params;

      const types = await Class_Type.findAll({
        where: { gym_id: gymId },
        order: [["name", "ASC"]],
      });

      res.json(types);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  createClassType: async (req, res) => {
    try {
      const { name, description, difficulty_level, max_participants, gym_id } =
        req.body;

      const hasAccess = await hasManagedGymAccess(req.user, gym_id);

      if (!hasAccess) {
        return res.status(403).json({ message: "Not authorized for this gym" });
      }

      const type = await Class_Type.create({
        name,
        description,
        difficulty_level,
        gym_id,
      });

      res.status(201).json(type);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  getSessionsByGym: async (req, res) => {
    try {
      const { gymId } = req.params;

      // Trainers/admins can always fetch; clients must have an active membership at this gym
      if (req.user.role === "client") {
        const membership = await Membership.findOne({
          where: { client_id: req.user.user_id, status: "active" },
          include: [{ model: Membership_Type, where: { gym_id: gymId }, attributes: [] }],
        });
        if (!membership) {
          return res.status(403).json({ message: "No active membership at this gym" });
        }
      }

      const sessions = await Class_Session.findAll({
        where: { gym_id: gymId },
        include: [
          Class_Type,
          { model: User, as: "Trainer", attributes: ["first_name", "last_name"] },
          {
            model: Class_Enrollment,
            where: { status: "confirmed" },
            required: false,
            attributes: ["enrollment_id"],
          },
        ],
        order: [["start_datetime", "ASC"]],
      });

      const result = sessions.map((s) => ({
        ...s.toJSON(),
        confirmed_count: s.Class_Enrollments?.length ?? 0,
        Class_Enrollments: undefined,
      }));

      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  createClassSession: async (req, res) => {
    try {
      const {
        class_type_id,
        gym_id,
        trainer_id,
        start_datetime,
        end_datetime,
        max_participants,
      } = req.body;

      if (new Date(start_datetime) >= new Date(end_datetime)) {
        return res.status(400).json({ message: "Invalid time interval" });
      }

      if (!max_participants || max_participants <= 0) {
        return res.status(400).json({ message: "Invalid max_participants" });
      }
      let finalTrainerId;

      if (req.user.role === "trainer") {
        finalTrainerId = req.user.user_id;
      } else if (req.user.role === "gym_admin") {
        if (!trainer_id) {
          return res.status(400).json({ message: "trainer_id is required" });
        }
        finalTrainerId = trainer_id;
      } else {
        return res.status(403).json({ message: "Not authorized" });
      }

      if (req.user.role === "gym_admin") {
        const hasAccess = await hasManagedGymAccess(req.user, gym_id);
        if (!hasAccess) {
          return res.status(403).json({ message: "Not authorized for this gym" });
        }
      }

      const gym = await Gym.findOne({ where: { gym_id } });
      if (!gym) {
        return res.status(400).json({ message: "Gym not found" });
      }

      const classType = await Class_Type.findOne({ where: { class_type_id } });
      if (!classType) {
        return res.status(400).json({ message: "Invalid class type" });
      }

      const trainer = await User.findOne({
        where: {
          user_id: finalTrainerId,
          role: "trainer",
          gym_id: gym_id,
        },
      });
      if (!trainer) {
        return res.status(400).json({ message: "Invalid trainer for this gym" });
      }

      const overlappingSession = await Class_Session.findOne({
        where: {
          trainer_id: finalTrainerId,
          status: {
            [Op.in]: ["scheduled", "ongoing"],
          },
          start_datetime: { [Op.lt]: end_datetime },
          end_datetime: { [Op.gt]: start_datetime },
        },
      });
      if (overlappingSession) {
        return res
          .status(400)
          .json({ message: "Trainer already has a session in this time interval" });
      }

      const session = await Class_Session.create({
        class_type_id,
        gym_id,
        trainer_id: finalTrainerId,
        start_datetime,
        end_datetime,
        max_participants,
      });

      res.status(201).json(session);
    } catch (err) {
      console.error("createClassSession error:", err);
      res
        .status(500)
        .json({ message: "An unexpected error occurred. Please try again later." });
    }
  },
  getSessionEnrollments: async (req, res) => {
    try {
      const { sessionId } = req.params;

      const session = await Class_Session.findByPk(sessionId);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const isTrainer = req.user.user_id === session.trainer_id;
      const isAdmin = await hasManagedGymAccess(req.user, session.gym_id);

      if (!isTrainer && !isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const enrollments = await Class_Enrollment.findAll({
        where: { session_id: sessionId },
        include: [{ model: User, as: "Client", attributes: ["first_name", "last_name", "email"] }],
        order: [["enrollment_date", "ASC"]],
      });

      res.json(enrollments);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  cancelSession: async (req, res) => {
    try {
      const { sessionId } = req.params;

      const session = await Class_Session.findByPk(sessionId);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const isTrainer = req.user.user_id === session.trainer_id;
      const isAdmin = await hasManagedGymAccess(req.user, session.gym_id);

      if (!isTrainer && !isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      session.status = "cancelled";
      await session.save();

      await Class_Enrollment.update(
        { status: "cancelled" },
        {
          where: {
            session_id: sessionId,
            status: {
              [Op.in]: ["confirmed", "waiting_list"],
            },
          },
        },
      );

      res.json({ message: "Session cancelled" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  getMyEnrollments: async (req, res) => {
    try {
      const clientId = req.user.user_id;

      const enrollments = await Class_Enrollment.findAll({
        where: { client_id: clientId },
        include: [
          {
            model: Class_Session,
            include: [
              Class_Type,
              { model: User, as: "Trainer", attributes: ["first_name", "last_name"] },
            ],
          },
        ],
        order: [["enrollment_date", "DESC"]],
      });

      res.json(enrollments);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};
