import { Workout_Session, Workout } from "../../models/index.js";

export const controller = {
  start: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { workout_id } = req.body;

      if (!workout_id) {
        return res.status(400).json({
          message: "workout_id is required",
        });
      }

      const existingSession = await Workout_Session.findOne({
        where: {
          user_id: userId,
          finished_at: null,
        },
      });

      if (existingSession) {
        return res.status(400).json({
          message: "You already have an active session",
        });
      }

      const workout = await Workout.findByPk(workout_id);

      if (!workout) {
        return res.status(404).json({
          message: "Workout not found",
        });
      }

      const hasAccess =
        workout.is_public ||
        workout.created_by_user_id === userId ||
        workout.assigned_to_user_id === userId;

      if (!hasAccess) {
        return res.status(403).json({
          message: "Forbidden",
        });
      }

      const session = await Workout_Session.create({
        user_id: userId,
        workout_id,
        started_at: new Date(),
      });

      return res.status(201).json(session);
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        message: "Error starting session",
      });
    }
  },

  finish: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.user_id;

      const session = await Workout_Session.findByPk(id);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (session.user_id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (session.finished_at) {
        return res.status(400).json({
          message: "Session already finished",
        });
      }

      await session.update({
        finished_at: new Date(),
      });

      return res.status(200).json(session);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error finishing session" });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.user_id;
      const { notes } = req.body;

      const session = await Workout_Session.findByPk(id);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (session.user_id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await session.update({ notes });

      return res.status(200).json(session);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error updating session" });
    }
  },

  getMine: async (req, res) => {
    try {
      const userId = req.user.user_id;

      const sessions = await Workout_Session.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Workout,
            include: [
              {
                model: Workout_Exercise,
                include: [
                  {
                    model: Exercise,
                    as: "exercise",
                  },
                ],
                order: [["order_index", "ASC"]],
              },
            ],
          },
        ],
        order: [["started_at", "DESC"]],
      });
      return res.status(200).json(sessions);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching sessions" });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.user_id;

      const session = await Workout_Session.findByPk(id, {
        include: [
          {
            model: Workout,
            include: [
              {
                model: Workout_Exercise,
                include: [
                  {
                    model: Exercise,
                    as: "exercise",
                  },
                ],
                order: [["order_index", "ASC"]],
              },
            ],
          },
        ],
      });

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (session.user_id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      return res.status(200).json(session);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching session" });
    }
  },
};
