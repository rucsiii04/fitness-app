import { db } from "../../config/db.js";
import {
  Workout_Session,
  Workout,
  Workout_Exercise,
  Exercise,
  Session_Exercise_Log,
} from "../../models/index.js";

export const controller = {
  start: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { workout_id } = req.body;

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

      if (workout_id) {
        const workout = await Workout.findByPk(workout_id);

        if (!workout) {
          return res.status(404).json({ message: "Workout not found" });
        }

        const hasAccess =
          workout.is_public ||
          workout.created_by_user_id === userId ||
          workout.assigned_to_user_id === userId;

        if (!hasAccess) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      const session = await Workout_Session.create({
        user_id: userId,
        workout_id: workout_id ?? null,
        started_at: new Date(),
      });

      return res.status(201).json(session);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error starting session" });
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
        return res.status(400).json({ message: "Session already finished" });
      }

      await session.update({ finished_at: new Date() });

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
        include: [{ model: Workout, attributes: ["workout_id", "name"] }],
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
                include: [{ model: Exercise }],
                order: [["order_index", "ASC"]],
              },
            ],
          },
          {
            model: Session_Exercise_Log,
            include: [{ model: Exercise }],
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

  logSet: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.user_id;
      const { exercise_id, reps, weight } = req.body;

      if (exercise_id == null || reps == null) {
        return res
          .status(400)
          .json({ message: "exercise_id and reps are required" });
      }

      const session = await Workout_Session.findByPk(id);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (session.user_id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (session.finished_at) {
        return res.status(400).json({ message: "Session already finished" });
      }

      const exercise = await Exercise.findByPk(exercise_id);
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }

      const t = await db.transaction();
      try {
        const existingSets = await Session_Exercise_Log.count({
          where: { session_id: id, exercise_id },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        const log = await Session_Exercise_Log.create(
          {
            session_id: id,
            exercise_id,
            set_number: existingSets + 1,
            reps,
            weight: weight ?? null,
            logged_at: new Date(),
          },
          { transaction: t },
        );

        await t.commit();
        return res.status(201).json(log);
      } catch (err) {
        await t.rollback();
        throw err;
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error logging set" });
    }
  },

  getSessionLogs: async (req, res) => {
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

      const logs = await Session_Exercise_Log.findAll({
        where: { session_id: id },
        include: [{ model: Exercise }],
        order: [["logged_at", "ASC"]],
      });

      return res.status(200).json(logs);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching logs" });
    }
  },
};
