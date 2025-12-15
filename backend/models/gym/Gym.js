import { DataTypes } from "sequelize";
import { db } from "../../config/db.js";

export const Gym = db.define(
  "Gym",
  {
    gym_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    max_capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    opening_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    closing_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    admin_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { freezeTableName: true, timestamps: false }
);
