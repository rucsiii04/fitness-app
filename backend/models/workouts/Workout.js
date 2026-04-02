import { DataTypes } from "sequelize";
import { db } from "../../config/db.js";

export const Workout = db.define(
  "Workout",
  {
    workout_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    source: {
      type: DataTypes.ENUM("trainer", "ai", "user"),
      allowNull: false,
    },

    created_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // null dacă workoutul e creat de ai
    },
    assigned_to_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    difficulty_level: {
      type: DataTypes.ENUM("beginner", "intermediate", "advanced"),
      allowNull: false,
    },

    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  },
);
