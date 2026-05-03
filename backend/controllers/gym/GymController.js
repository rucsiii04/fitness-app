import { Op } from "sequelize";
import {
  Gym,
  Membership,
  Membership_Type,
  Class_Session,
  Class_Enrollment,
} from "../../models/index.js";

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isGymOpen = (opening_time, closing_time) => {
  const now = new Date();
  const [oh, om] = opening_time.split(":").map(Number);
  const [ch, cm] = closing_time.split(":").map(Number);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = oh * 60 + om;
  const closeMinutes = ch * 60 + cm;
  if (closeMinutes > openMinutes) {
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  }
  return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
};

export const controller = {
  getAlert: async (req, res) => {
    try {
      const gym = await Gym.findByPk(req.params.gymId, {
        attributes: [
          "opening_time",
          "closing_time",
          "alert_message",
          "alert_expires_at",
        ],
      });
      if (!gym) return res.status(404).json({ message: "Gym not found" });

      const alertActive =
        gym.alert_message &&
        (!gym.alert_expires_at || new Date(gym.alert_expires_at) > new Date());

      if (alertActive) {
        return res.json({
          message: gym.alert_message,
          expires_at: gym.alert_expires_at ?? null,
        });
      }

      if (!isGymOpen(gym.opening_time, gym.closing_time)) {
        const fmt = (t) => t.slice(0, 5);
        return res.json({
          message: `Sala este închisă acum. Program: ${fmt(gym.opening_time)} – ${fmt(gym.closing_time)}`,
          expires_at: null,
        });
      }

      return res.json({ message: null, expires_at: null });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  setAlert: async (req, res) => {
    try {
      const { gymId } = req.params;
      const { message, end_at } = req.body;

      const gym = await Gym.findOne({
        where: { gym_id: gymId, admin_user_id: req.user.user_id },
      });
      if (!gym)
        return res
          .status(404)
          .json({ message: "Gym not found or you do not manage it" });

      if (!message) {
        await gym.update({ alert_message: null, alert_expires_at: null });
        return res.json({ message: null, expires_at: null });
      }

      const alertExpiresAt = end_at ? new Date(end_at) : null;
      await gym.update({
        alert_message: message,
        alert_expires_at: alertExpiresAt,
      });
      return res.json({ message, expires_at: alertExpiresAt });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  extendMemberships: async (req, res) => {
    try {
      const { gymId } = req.params;

      const gym = await Gym.findOne({
        where: { gym_id: gymId, admin_user_id: req.user.user_id },
      });
      if (!gym)
        return res
          .status(404)
          .json({ message: "Gym not found or you do not manage it" });

      const memberships = await Membership.findAll({
        where: { status: { [Op.in]: ["active", "paused"] } },
        include: {
          model: Membership_Type,
          where: { gym_id: gymId },
          attributes: [],
        },
      });

      for (const m of memberships) {
        await m.update({ end_date: addDays(m.end_date, 1) });
      }

      return res.json({ extended_count: memberships.length });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  cancelAffectedClasses: async (req, res) => {
    try {
      const { gymId } = req.params;

      const gym = await Gym.findOne({
        where: { gym_id: gymId, admin_user_id: req.user.user_id },
      });
      if (!gym)
        return res
          .status(404)
          .json({ message: "Gym not found or you do not manage it" });

      const closureStart = new Date();
      const closureEnd = gym.alert_expires_at
        ? new Date(gym.alert_expires_at)
        : null;

      const sessionWhere = {
        gym_id: gymId,
        status: "scheduled",
        end_datetime: { [Op.gt]: closureStart },
      };
      if (closureEnd) {
        sessionWhere.start_datetime = { [Op.lt]: closureEnd };
      }

      const sessions = await Class_Session.findAll({ where: sessionWhere });

      if (!sessions.length) {
        return res.json({ cancelled_count: 0 });
      }

      const sessionIds = sessions.map((s) => s.session_id);

      await Class_Session.update(
        { status: "cancelled" },
        { where: { session_id: { [Op.in]: sessionIds } } },
      );

      await Class_Enrollment.update(
        { status: "cancelled" },
        {
          where: {
            session_id: { [Op.in]: sessionIds },
            status: { [Op.in]: ["confirmed", "waiting_list"] },
          },
        },
      );

      return res.json({ cancelled_count: sessions.length });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
};
