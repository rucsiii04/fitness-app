import { Op } from "sequelize";
import { Membership } from "../models/index.js";

export const resumeExpiredPauses = async () => {
  await Membership.update(
    {
      status: "active",
      pause_start_date: null,
      pause_end_date: null,
      pause_reason: null,
    },
    {
      where: {
        status: "paused",
        frozen_by_admin: false,
        pause_end_date: { [Op.lte]: new Date() },
      },
    }
  );
};
