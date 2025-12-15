import { DataTypes } from "sequelize";
import { db } from "../../config/db.js";

export const QR_Code = db.define(
  "QR_Code",
  {
    qr_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    token_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    generated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);
