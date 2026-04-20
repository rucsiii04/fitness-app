import { Gym } from "../../models/index.js";

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
        attributes: ["opening_time", "closing_time", "alert_message", "alert_expires_at"],
      });
      if (!gym) return res.status(404).json({ message: "Gym not found" });

      // Admin custom alert takes priority if not expired
      const alertActive =
        gym.alert_message &&
        (!gym.alert_expires_at || new Date(gym.alert_expires_at) > new Date());

      if (alertActive) {
        return res.json({
          message: gym.alert_message,
          expires_at: gym.alert_expires_at ?? null,
        });
      }

      // Fallback: automatic closed notice
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
      const { message, days } = req.body;

      const gym = await Gym.findOne({
        where: { gym_id: gymId, admin_user_id: req.user.user_id },
      });
      if (!gym)
        return res.status(404).json({ message: "Gym not found or you do not manage it" });

      if (!message) {
        await gym.update({ alert_message: null, alert_expires_at: null });
        return res.json({ message: null, expires_at: null });
      }

      if (days !== undefined && (typeof days !== "number" || days < 1 || days > 30)) {
        return res.status(400).json({ message: "days must be between 1 and 30" });
      }

      const expires_at = days
        ? new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        : null;

      await gym.update({ alert_message: message, alert_expires_at: expires_at });
      return res.json({ message, expires_at });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
};
