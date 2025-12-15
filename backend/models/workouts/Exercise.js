import { DataTypes, DATE } from "sequelize";
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
    exercise_type: {
      type: DataTypes.ENUM("machine", "free-weights", "bodyweight"),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);
