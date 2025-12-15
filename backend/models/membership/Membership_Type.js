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
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);
