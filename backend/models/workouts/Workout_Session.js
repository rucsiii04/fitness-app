import { DataTypes } from "sequelize";
import { db } from "../../config/db.js";

export const Workout_Session = db.define(
  "Workout_Session",
  {
    session_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    workout_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },//nu mai lasam null->feature pe mai departe sa si poata adauga ex pe masura ce isi face antrenamente 

    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    finished_at: {
      type: DataTypes.DATE,
      allowNull: true,
      //se completeaza cand userul apasa incheiere workout
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  },
);
