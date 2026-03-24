import { DataTypes } from "sequelize";
import { db } from "../../config/db.js";

export const Class_Type = db.define(
  "Class_Type",
  {
    class_type_id: {
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
      allowNull: false,
    },
    difficulty_level: {
      type: DataTypes.ENUM("beginner", "intermediate", "advanced"),
      allowNull: false,
    },
    max_participants: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    gym_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Gym",
        key: "gym_id",
      },
    },
  },
  { freezeTableName: true, timestamps: false }
);
