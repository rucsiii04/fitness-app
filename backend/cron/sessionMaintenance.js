import cron from "node-cron";
import { syncExpiredNoShows } from "../utils/syncNoShow.js";
import { updateSessionStatuses } from "../utils/sessionStatusUpdate.js";

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
  cron.schedule("0 */6 * * *", async () => {//la fiecare 6 ore
    console.log("Running maintenance cron...");

    await Membership.update(
      { status: "expired" },
      {
        where: {
          status: "active",
          end_date: { [Op.lt]: new Date() },
        },
      },
    );

    console.log("Membership expiry check done.");
  });
};
