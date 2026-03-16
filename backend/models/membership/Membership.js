import { DataTypes } from "sequelize";
import { db } from "../../config/db.js";

export const Membership = db.define(
  "Membership",
  {
    membership_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    membership_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "expired", "cancelled", "paused"),
      allowNull: false,
      defaultValue: "active",
    },
    payment_method: {
      type: DataTypes.ENUM("card", "cash"),
      allowNull: false,
    },
    remaining_freeze_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    pause_start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pause_end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pause_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cancelled_reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  },
);
