import cron from "node-cron";
import { syncExpiredNoShows } from "../utils/syncNoShow.js";
import { updateSessionStatuses } from "../utils/sessionStatusUpdate.js";
import { Membership } from "../models/index.js";
import { Op } from "sequelize";

export const runSessionMaintenance = async () => {
  try {
    await updateSessionStatuses();
    await syncExpiredNoShows();

    await Membership.update(
      { status: "expired" },
      {
        where: {
          status: "active",
          end_date: { [Op.lt]: new Date() },
        },
      }
    );

    console.log("Maintenance executed");
  } catch (error) {
    console.error("Maintenance error:", error);
  }
};

export const startSessionMaintenanceCron = () => {
  cron.schedule("*/5 * * * *", runSessionMaintenance);
};