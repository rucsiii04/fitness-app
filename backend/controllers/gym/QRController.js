import crypto from "crypto";
import { Op } from "sequelize";
import {
  QR_Code,
  Membership,
  Membership_Type,
  Gym_Attendance,
  Client_Profile,
  User,
} from "../../models/index.js";

export const controller = {
  generateQR: async (req, res) => {
    try {
      const user_id = req.user.user_id;
      const membership = await Membership.findOne({
        where: { client_id: user_id, status: "active" },
        include: [{ model: Membership_Type, attributes: ["name", "gym_id"] }],
      });

      if (!membership) {
        return res
          .status(403)
          .json({ message: "No active membership. Cannot generate QR code." });
      }

      await QR_Code.update(
        { is_used: true },
        { where: { user_id, is_used: false } },
      );

      const rawToken = crypto.randomBytes(32).toString("hex");
      const token_hash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      await QR_Code.create({
        user_id,
        token_hash,
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
        is_used: false,
      });

      return res.status(201).json({ token: rawToken });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error generating QR code: " + err.message });
    }
  },

  getMyQR: async (req, res) => {
    try {
      const user_id = req.user.user_id;
      const qr = await QR_Code.findOne({
        where: {
          user_id,
          is_used: false,
          expires_at: { [Op.gt]: new Date() },
        },
        attributes: ["qr_id", "generated_at", "expires_at"],
        order: [["generated_at", "DESC"]],
      });

      if (!qr) {
        return res.status(404).json({ message: "No active QR code found" });
      }

      return res.status(200).json(qr);
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error fetching QR code: " + err.message });
    }
  },

  deleteMyQR: async (req, res) => {
    try {
      const user_id = req.user.user_id;
      const [count] = await QR_Code.update(
        { is_used: true },
        { where: { user_id, is_used: false } },
      );

      if (!count) {
        return res
          .status(404)
          .json({ message: "No active QR code to invalidate" });
      }

      return res.status(200).json({ message: "QR code invalidated" });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error invalidating QR code: " + err.message });
    }
  },

  scanQR: async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      const token_hash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const qrRecord = await QR_Code.findOne({ where: { token_hash } });

      if (!qrRecord) {
        return res.status(404).json({ message: "Invalid QR code" });
      }

      if (qrRecord.is_used) {
        return res.status(400).json({ message: "QR code already used" });
      }

      if (qrRecord.expires_at < new Date()) {
        return res.status(400).json({ message: "QR code expired" });
      }

      const gym_id = req.user.gym_id;

      const membership = await Membership.findOne({
        where: {
          client_id: qrRecord.user_id,
          status: "active",
        },
        include: [
          {
            model: Membership_Type,
            where: { gym_id },
            attributes: ["name", "gym_id"],
          },
        ],
      });

      if (!membership) {
        return res
          .status(403)
          .json({ message: "No active membership for this gym" });
      }

      await qrRecord.update({ is_used: true });

      await Gym_Attendance.create({
        user_id: qrRecord.user_id,
        gym_id,
        entry_time: new Date(),
      });

      const client = await User.findByPk(qrRecord.user_id, {
        include: [{ model: Client_Profile }],
      });

      return res.status(200).json({
        message: "Access granted",
        client: {
          name: `${client.first_name} ${client.last_name}`,
          membership_type: membership.Membership_Type.name,
          expires_at: membership.end_date,
        },
      });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error scanning QR code: " + err.message });
    }
  },
};
