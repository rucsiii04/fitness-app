import { DataTypes } from "sequelize";
import { db } from "../../config/db.js";

export const Membership_Type = db.define(
  "Membership_Type",
  {
    membership_type_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    duration_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    includes_group_classes: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    freeze_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    gym_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "Gym", key: "gym_id" },
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  },
);
