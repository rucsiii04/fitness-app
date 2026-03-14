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
      type: DataTypes.ENUM(
        "client",
        "trainer",
        "front_desk",
        "gym_admin",
        "admin_global",
      ),
      defaultValue: "client",
    },

    registration_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    gym_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // trainer_id: {
    //   type: DataTypes.INTEGER,
    //   allowNull: true,
    //   references: {
    //     model: "User",
    //     key: "user_id",
    //   },
    //   onDelete: "SET NULL",
    // }, //nu mi mai trb ca am tabela trainer assignments

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
  },
);
