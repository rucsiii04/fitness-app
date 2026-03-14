import { DataTypes } from "sequelize";
import { db } from "../../config/db.js";

export const Trainer_Profile = db.define(
  "Trainer_Profile",
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    experience_years: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image_public_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  },
);
