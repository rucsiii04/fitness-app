import { Op } from "sequelize";
import { Membership } from "../models/index.js";

export const expireOutdatedMemberships = async () => {
  await Membership.update(
    { status: "expired" },
    {
      where: {
        status: "active",
        end_date: { [Op.lt]: new Date() },
      },
    }
  );
};
