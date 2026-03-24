import { Op } from "sequelize";
import { Class_Enrollment, Class_Session } from "../models/index.js";
import { addMinutes } from "./dateUtils.js";

const NO_SHOW_DELAY_MINUTES = 15;

export const syncExpiredNoShows = async () => {

  const expiredSessions = await Class_Session.findAll({
    where: {
      status: {
        [Op.ne]: "cancelled",
      },
      end_datetime: {
        [Op.lt]: addMinutes(new Date(), -NO_SHOW_DELAY_MINUTES),
      },
    },
    attributes: ["session_id"],
  });

  if (!expiredSessions.length) return;

  await Class_Enrollment.update(
    { status: "no_show" },
    {
      where: {
        session_id: {
          [Op.in]: expiredSessions.map((s) => s.session_id),
        },
        status: "confirmed",
      },
    }
  );
};