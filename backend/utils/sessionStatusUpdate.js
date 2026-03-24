import { Op } from "sequelize";
import { Class_Session } from "../models/index.js";

export const updateSessionStatuses = async () => {

  const now = new Date();

  await Class_Session.update(
    { status: "ongoing" },
    {
      where: {
        status: "scheduled",
        start_datetime: {
          [Op.lte]: now,
        },
        end_datetime: {
          [Op.gt]: now,
        },
      },
    }
  );

  
  await Class_Session.update(
    { status: "finished" },
    {
      where: {
        status: "ongoing",
        end_datetime: {
          [Op.lte]: now,
        },
      },
    }
  );
};