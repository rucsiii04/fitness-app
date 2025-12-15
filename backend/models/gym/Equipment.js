import { DataTypes, DATE } from "sequelize";
import { db } from "../../config/db.js";

export const Equipment = db.define(
  "Equipment",
  {
    equipement_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    equipement_type: {
      type: DataTypes.ENUM(
        "machine",
        "free_weights",
        "cardio",
        "bodyweight",
        "functional"
      ),
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
