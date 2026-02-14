import { DataTypes } from "sequelize";
import { db } from "../../config/db.js";

export const Client_Profile = db.define(
  "Client_Profile",
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    current_weight: {
      type: DataTypes.FLOAT,
    },
    height: {
      type: DataTypes.FLOAT,
    },
    activity_level: {
      type: DataTypes.ENUM(
        "sedentary",
        "light",
        "moderate",
        "active",
        "very_active",
      ),
    },
    main_goal: {
      type: DataTypes.ENUM("lose_weight", "maintain", "gain_weight"),
    },
    gender: {
      type: DataTypes.ENUM("male", "female"),
      allowNull: false,
    },
    medical_restriction: {
      type: DataTypes.STRING,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  },
);
