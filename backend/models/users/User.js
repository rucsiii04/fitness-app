import { DataTypes } from "sequelize";
import { db } from "../../config/db.js";

export const User = db.define(
  "User",
  {
    user_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    role: {
      type: DataTypes.ENUM("client", "trainer","receptionist", "gym_admin", "admin_global"),
      defaultValue: "client",
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    registration_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    gym_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
  }
);
