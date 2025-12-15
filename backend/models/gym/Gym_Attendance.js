import { DataTypes } from "sequelize";
import { db } from "../../config/db.js";

export const Gym_Attendance = db.define(
  "Gym_Attendance",
  {
    attendance_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    gym_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    entry_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    exit_time: {
      type: DataTypes.DATE,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);
