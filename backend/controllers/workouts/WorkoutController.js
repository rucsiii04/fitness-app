import { Op } from "sequelize";
import { Workout } from "../../models/index.js";
export const controller = { 

getAll: async (req, res) => {
  try {
    const userId = req.user.id;

    const workouts = await Workout.findAll({
      where: {
        [Op.or]: [
          { is_public: true },
          { created_by_user_id: userId },
          { assigned_to_user_id: userId }, // 🔥 NEW
        ],
      },
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json(workouts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
},
getById: async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const workout = await Workout.findByPk(id);

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

    return res.status(200).json(workout);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
},
create: async (req, res) => {
  try {
    const user = req.user;

    const {
      name,
      description,
      difficulty_level,
      is_public,
      assigned_to_user_id,
    } = req.body;

    const isTrainer = user.role === "trainer";


    if (is_public && !isTrainer) {
      return res.status(403).json({
        message: "Only trainers can create public workouts",
      });
    }

    let assignedUserId = null;

    if (is_public) {
      assignedUserId = null; 
    } else if (isTrainer) {
      if (!assigned_to_user_id) {
        return res.status(400).json({
          message: "Trainer must assign workout to a client",
        });
      }
      assignedUserId = assigned_to_user_id;
    } else {
      assignedUserId = user.id;
    }

    const workout = await Workout.create({
      name,
      description,
      difficulty_level,

      is_public: isTrainer ? !!is_public : false,

      source: isTrainer ? "trainer" : "user",

      created_by_user_id: user.id,

      assigned_to_user_id: assignedUserId,
    });

    return res.status(201).json(workout);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
},
 }