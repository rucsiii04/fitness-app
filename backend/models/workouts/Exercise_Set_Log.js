import { DataTypes } from "sequelize";
import { db } from "../../config/db.js";

export const Exercise_Set_Log = db.define(
  "Exercise_Set_Log",
  {
    set_log_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    session_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    exercise_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    workout_exercise_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    set_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    weight: {
      type: DataTypes.FLOAT,
    },
    repetitions: {
      type: DataTypes.INTEGER,
    },
    logged_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);
