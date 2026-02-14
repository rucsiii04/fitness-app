import { DataTypes } from "sequelize";
import { db } from "../../config/db.js";
export const Trainer_Assignment = db.define("Trainer_Assignment", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  trainer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "User",
      key: "user_id",
    },
    onDelete: "CASCADE",
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "User",
      key: "user_id",
    },
    onDelete: "CASCADE",
  },
  requested_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "accepted", "rejected"),
    defaultValue: "pending",
  },
});
