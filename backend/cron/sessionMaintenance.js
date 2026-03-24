import cron from "node-cron";
import { syncExpiredNoShows } from "../utils/noShowUtils.js";
import { updateSessionStatuses } from "../utils/sessionStatusUtils.js";

export const startSessionMaintenanceCron = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      await updateSessionStatuses();

      await syncExpiredNoShows();

      console.log("Session maintenance cron executed");
    } catch (error) {
      console.error("Cron error:", error);
    }
  });
};
