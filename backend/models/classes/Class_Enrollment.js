import { DataTypes, DATE } from "sequelize";
import { db } from "../../config/db.js";

export const Class_Enrollment = db.define(
  "Class_Enrollment",
  {
    enrollment_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    session_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    enrollment_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM(
        "confirmed",
        "cancelled",
        "attended",
        "no_show",
        "waiting_list"
      ),
      allowNull: false,
      defaultValue: "confirmed",
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);
