import { DataTypes } from "sequelize";
import { db } from "../../config/db.js";

export const Workout_Exercise = db.define(
  "Workout_Exercise",
  {
    id: {
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

    sets: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    reps: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    rest_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "seconds",
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);