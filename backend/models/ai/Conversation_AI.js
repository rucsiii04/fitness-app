import { DataTypes } from "sequelize";
import { db } from "../../config/db.js";

export const Conversation_AI = db.define(
  "Conversation_AI",
  {
    conversation_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    last_activity_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    linked_plan_id: {
      type: DataTypes.INTEGER,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);
