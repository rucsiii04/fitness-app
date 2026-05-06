import cron from "node-cron";
import { syncExpiredNoShows } from "../utils/syncNoShow.js";
import { updateSessionStatuses } from "../utils/sessionStatusUpdate.js";
import { expireOutdatedMemberships } from "../utils/expireMemberships.js";

export const runSessionMaintenance = async () => {
  try {
    await updateSessionStatuses();
    await syncExpiredNoShows();
    await expireOutdatedMemberships();
    console.log("Maintenance executed");
  } catch (error) {
    console.error("Maintenance error:", error);
  }
};

export const startSessionMaintenanceCron = () => {
  cron.schedule("*/5 * * * *", runSessionMaintenance);
};
