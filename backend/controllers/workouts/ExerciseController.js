import { Exercise } from "../../models/index.js";

export const controller = {
  getAll: async (req, res) => {
    try {
      const { muscle_group, include_inactive } = req.query;

      const where = {};

      if (!include_inactive) {
        where.is_active = true;
      }

      if (muscle_group) {
        where.muscle_group = muscle_group;
      }

      const exercises = await Exercise.findAll({ where });

      return res.status(200).json(exercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const exercise = await Exercise.findByPk(id);

      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }

      return res.status(200).json(exercise);
    } catch (error) {
      console.error("Error fetching exercise:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  create: async (req, res) => {
    try {
    

      const { name, muscle_group, equipment_required, description } = req.body;

      if (!name || !muscle_group) {
        return res.status(400).json({
          message: "Name and muscle_group are required",
        });
      }

      const exercise = await Exercise.create({
        name,
        muscle_group,
        equipment_required,
        description,
      });

      return res.status(201).json(exercise);
    } catch (error) {
      console.error("Error creating exercise:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  update: async (req, res) => {
    try {
   
      const { id } = req.params;
      const { name, muscle_group, equipment_required, description } = req.body;

      const exercise = await Exercise.findByPk(id);

      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }

      await exercise.update({
        name: name ?? exercise.name,
        muscle_group: muscle_group ?? exercise.muscle_group,
        equipment_required: equipment_required ?? exercise.equipment_required,
        description: description ?? exercise.description,
      });

      return res.status(200).json(exercise);
    } catch (error) {
      console.error("Error updating exercise:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  delete: async (req, res) => {
    try {
    

      const { id } = req.params;

      const exercise = await Exercise.findByPk(id);

      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }

      if (!exercise.is_active) {
        return res.status(400).json({ message: "Exercise already inactive" });
      }

      await exercise.update({ is_active: false });

      return res.status(200).json({
        message: "Exercise deactivated successfully",
      });
    } catch (error) {
      console.error("Error deactivating exercise:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
  restore: async (req, res) => {
    try {
   
      const { id } = req.params;

      const exercise = await Exercise.findByPk(id);

      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }

      await exercise.update({ is_active: true });

      return res.status(200).json({
        message: "Exercise restored successfully",
      });
    } catch (error) {
      console.error("Error restoring exercise:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};
