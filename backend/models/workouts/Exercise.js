import { DataTypes } from "sequelize";
import { db } from "../../config/db.js";

export const Exercise = db.define(
  "Exercise",
  {
    exercise_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    muscle_group: {
      type: DataTypes.ENUM(
        "chest",
        "back",
        "legs",
        "shoulders",
        "arms",
        "core",
        "full-body"
      ),
      allowNull: false,
    },

    equipment_required: {
      type: DataTypes.STRING, 
      allowNull: true, 
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);
