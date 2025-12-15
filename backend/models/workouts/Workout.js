import { DataTypes, DATE } from "sequelize";
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
      type: DataTypes.STRING,
    },
    source: {
      type: DataTypes.ENUM("trainer", "ai", "user"),
      allowNull: false,
    },
    created_by_user_id: {
      type: DataTypes.INTEGER, //this can also be null if this was made by the AI
      allowNull: true,
    },
    assigned_to_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // in case the user made a workout for himself=this will be null
    },
    difficulty_level: {
      type: DataTypes.ENUM("beginner", "intermediate", "advanced"),
      allowNull: false,
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
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
  }
);
