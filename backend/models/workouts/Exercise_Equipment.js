import { DataTypes } from "sequelize";
import { db } from "../../config/db.js";

export const Exercise_Equipment = db.define(
  "Exercise_Equipment",
  {
    exercise_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    equipement_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);
