import { Exercise, Workout, Workout_Exercise } from "../../models/index.js";
import { db } from "../../config/db.js";

export const controller = {
  getByWorkout: async (req, res) => {
    try {
      const { workoutId } = req.params;
      const userId = req.user.user_id;

      const workout = await Workout.findByPk(workoutId);

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

      const items = await Workout_Exercise.findAll({
        where: { workout_id: workoutId },
        include: [
          {
            model: Exercise,
            as: "exercise",
          },
        ],
        order: [["order_index", "ASC"]],
      });

      return res.status(200).json(items);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching exercises" });
    }
  },

  addOne: async (req, res) => {
    try {
      const { workoutId } = req.params;
      const userId = req.user.user_id;

      const { exercise_id, sets, reps, rest_time, notes } = req.body;

      const workout = await Workout.findByPk(workoutId);

      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }

      if (workout.created_by_user_id !== userId) {
        return res.status(403).json({
          message: "You are not allowed to modify this workout",
        });
      }

      const exercise = await Exercise.findByPk(exercise_id);

      if (!exercise) {
        return res.status(400).json({ message: "Invalid exercise_id" });
      }

      const count = await Workout_Exercise.count({
        where: { workout_id: workoutId },
      });

      const item = await Workout_Exercise.create({
        workout_id: workoutId,
        exercise_id,
        order_index: count,
        sets,
        reps,
        rest_time,
        notes,
      });

      return res.status(201).json(item);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error adding exercise" });
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.user_id;

      const item = await Workout_Exercise.findByPk(id);

      if (!item) {
        return res.status(404).json({ message: "Not found" });
      }

      const workout = await Workout.findByPk(item.workout_id);

      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }

      if (workout.created_by_user_id !== userId) {
        return res.status(403).json({
          message: "You are not allowed to modify this workout",
        });
      }

      await item.destroy();

      return res.status(200).json({ message: "Deleted" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error deleting" });
    }
  },

  replaceAll: async (req, res) => {
    const t = await db.transaction();

    try {
      const { workoutId } = req.params;
      const userId = req.user.user_id;

      const { exercises } = req.body;

      const workout = await Workout.findByPk(workoutId);

      if (!workout) {
        await t.rollback();
        return res.status(404).json({ message: "Workout not found" });
      }

      if (workout.created_by_user_id !== userId) {
        await t.rollback();
        return res.status(403).json({
          message: "You are not allowed to modify this workout",
        });
      }

      const exerciseIds = exercises.map((e) => e.exercise_id);

      const existingExercises = await Exercise.findAll({
        where: { exercise_id: exerciseIds },
      });

      if (existingExercises.length !== exerciseIds.length) {
        await t.rollback();
        return res.status(400).json({
          message: "One or more exercise_id are invalid",
        });
      }

      await Workout_Exercise.destroy({
        where: { workout_id: workoutId },
        transaction: t,
      });

      const created = await Promise.all(
        exercises.map((ex, index) =>
          Workout_Exercise.create(
            {
              workout_id: workoutId,
              exercise_id: ex.exercise_id,
              order_index: index,
              sets: ex.sets,
              reps: ex.reps,
              rest_time: ex.rest_time,
              notes: ex.notes,
            },
            { transaction: t },
          ),
        ),
      );

      await t.commit();

      return res.status(200).json(created);
    } catch (err) {
      await t.rollback();
      console.error(err);
      return res.status(500).json({ message: "Error replacing workout" });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.user_id;

      const item = await Workout_Exercise.findByPk(id);

      if (!item) {
        return res.status(404).json({ message: "Not found" });
      }

      const workout = await Workout.findByPk(item.workout_id);

      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }

      if (workout.created_by_user_id !== userId) {
        return res.status(403).json({
          message: "You are not allowed to modify this workout",
        });
      }

      await item.update({
        sets: req.body.sets,
        reps: req.body.reps,
        rest_time: req.body.rest_time,
        notes: req.body.notes,
      });

      return res.status(200).json(item);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error updating" });
    }
  },
};
