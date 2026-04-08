import crypto from "crypto";
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { db } from "../../config/db.js";
import { User, Reset_Token, Gym } from "../../models/index.js";
import { transporter } from "../../config/mail.js";

export const controller = {
  createGymAdmin: async (req, res) => {
    try {
      const { email, first_name, last_name, phone } = req.body;

      if (!email || !first_name || !last_name || !phone) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const existing = await User.findOne({
        where: { [Op.or]: [{ email }, { phone }] },
      });
      if (existing) {
        if (existing.email === email) {
          return res.status(409).json({ message: "Email already used" });
        } else {
          return res.status(409).json({ message: "Phone already in used" });
        }
      }
      const tempPassword = crypto.randomBytes(16).toString("hex");
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const gymAdmin = await User.create({
        email,
        password: hashedPassword,
        first_name,
        last_name,
        phone,
        role: "gym_admin",
        is_active: false,
        registration_date: new Date(),
      });
      const token = crypto.randomBytes(32).toString("hex");
      const token_hash = await bcrypt.hash(token, 10);

      await Reset_Token.create({
        user_id: gymAdmin.user_id,
        token_hash,
        expires_at: new Date(Date.now() + 1000 * 60 * 60),
      });
      const resetLink = `${process.env.CLIENT_URL}/set-password?token=${token}&userId=${gymAdmin.user_id}`;
      await transporter.sendMail({
        to:gymAdmin.email,
        subject:"Set your password - Fitness App",
        html:`
         <p>Hello ${gymAdmin.first_name},</p>
        <p>Your gym admin account has been created.</p>
        <p>Click below to set your password:</p>
        <a href="${resetLink}">Set Password</a>
        <p>Link expires in 1 hour.</p>
        `
      });
      return res.status(200).json({ message: "Gym admin created. Email sent." })
    } catch (err) {
      return res.status(500).json({ message: "Error: "+err });
    }
  },
};
