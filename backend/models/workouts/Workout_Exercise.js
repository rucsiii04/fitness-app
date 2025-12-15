import { DataTypes } from "sequelize";
import { db } from "../../config/db.js";

export const Workout_Exercise = db.define(
  "Workout_Exercise",
  {
    workout_exercise_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    workout_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    exercise_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    order_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    target_sets: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    target_reps: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    target_rest_seconds: {
      type: DataTypes.INTEGER,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);
