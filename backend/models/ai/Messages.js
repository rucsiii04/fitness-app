import { DataTypes } from "sequelize";
import { db } from "../../config/db.js";

export const Message = db.define(
  "Message",
  {
    message_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    conversation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sender: {
      type: DataTypes.ENUM("user", "AI"),
      allowNull: false,
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    content: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);
