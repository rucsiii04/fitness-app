import { DataTypes } from "sequelize";
import { db } from "../../config/db.js";

export const Gym_Equipment = db.define(
  "Gym_Equipment",
  {
    gym_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    equipment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    manufacturer: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    purchase_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM("functional", "maintenance", "out_of_service"),
      defaultValue: "functional",
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);
