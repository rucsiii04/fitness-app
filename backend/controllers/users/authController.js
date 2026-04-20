import crypto from "crypto";
import bcrypt from "bcrypt";
import { User } from "../../models/index.js";
import { Reset_Token } from "../../models/index.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { generateToken } from "../../utils/jwt.js";
import { transporter } from "../../config/mail.js";
import { Op } from "sequelize";

export const controller = {
  register: async (req, res) => {
    try {
      const { email, password, first_name, last_name, phone } = req.body;

      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email }, { phone }],
        },
      });

      if (existingUser) {
        if (existingUser.email === email) {
          return res.status(409).json({ message: "Email already used" });
        }

        if (existingUser.phone === phone) {
          return res.status(409).json({ message: "Phone number already used" });
        }
      }

      const hashedPassword = await hashPassword(password);

      const user = await User.create({
        email,
        password: hashedPassword,
        first_name,
        last_name,
        phone,
        registration_date: new Date(),
      });

      const token = generateToken(user);

      res.status(201).json({
        token,
        user: {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      });
    } catch (err) {
      res.status(500).json({ message: "Error: " + err });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });

      if (!user || !user.is_active) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const validPassword = await comparePassword(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user);

      res.status(200).json({
        token,
        user: {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
          gym_id: user.gym_id,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      });
    } catch (err) {
      res.status(500).json({ message: "Login error: " + err });
    }
  },

  requestPasswordReset: async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(200).json({
          message: "If the email exists, you will receive reset instructions",
        });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const token_hash = await bcrypt.hash(token, 10);

      await Reset_Token.update(
        { used: true },
        { where: { user_id: user.user_id, used: false } },
      );

      await Reset_Token.create({
        user_id: user.user_id,
        token_hash,
        expires_at: new Date(Date.now() + 1000 * 60 * 30),
      });

      const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}&userId=${user.user_id}`;

      await transporter.sendMail({
        from: "Fitness App",
        to: user.email,
        subject: "Resetare parola",
        html: `
          <p>Salut ${user.first_name},</p>
          <p>Apasă pe link pentru a-ți reseta parola:</p>
          <a href="${resetLink}">Resetare parola</a>
          <p>Link-ul este valabil 30 de minute.</p>
        `,
      });

      return res.status(200).json({
        message: "If the email exists, you will receive reset instructions",
      });
    } catch (err) {
      res.status(500).json({ message: "Reset error: " + err });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { userId, token, newPassword } = req.body;

      const resetToken = await Reset_Token.findOne({
        where: { used: false, user_id: userId },
      });

      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      if (resetToken.expires_at < new Date()) {
        return res.status(400).json({ message: "Token expired" });
      }

      const valid = await bcrypt.compare(token, resetToken.token_hash);

      if (!valid) {
        return res.status(400).json({ message: "Invalid token" });
      }

      const hashedPassword = await hashPassword(newPassword);

      await User.update(
        { password: hashedPassword, is_active: true },
        { where: { user_id: userId } },
      );

      await Reset_Token.update({ used: true }, { where: { user_id: userId } });

      return res.status(200).json({ message: "Password reset successfully" });
    } catch (err) {
      return res.status(500).json({ message: "Error: " + err });
    }
  },

  me: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.user_id, {
        attributes: ["user_id", "email", "role", "gym_id", "first_name", "last_name", "phone"],
      });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  updateAccount: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { first_name, last_name, email, phone } = req.body;

      if (!first_name && !last_name && !email && !phone) {
        return res.status(400).json({ message: "No fields provided" });
      }

      if (email || phone) {
        const conflict = await User.findOne({
          where: {
            [Op.or]: [
              ...(email ? [{ email }] : []),
              ...(phone ? [{ phone }] : []),
            ],
            user_id: { [Op.ne]: userId },
          },
        });
        if (conflict) {
          if (email && conflict.email === email)
            return res.status(409).json({ message: "Email-ul este deja folosit" });
          if (phone && conflict.phone === phone)
            return res.status(409).json({ message: "Numărul de telefon este deja folosit" });
        }
      }

      const updates = {};
      if (first_name) updates.first_name = first_name;
      if (last_name) updates.last_name = last_name;
      if (email) updates.email = email;
      if (phone) updates.phone = phone;

      await User.update(updates, { where: { user_id: userId } });

      const updated = await User.findByPk(userId, {
        attributes: ["user_id", "email", "role", "gym_id", "first_name", "last_name", "phone"],
      });
      return res.status(200).json(updated);
    } catch (err) {
      return res.status(500).json({ message: "Eroare: " + err.message });
    }
  },

  updatePassword: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { oldPassword, newPassword } = req.body;

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValid = await comparePassword(oldPassword, user.password);

      if (!isValid) {
        return res.status(400).json({ message: "Old password incorrect" });
      }

      const samePassword = await comparePassword(newPassword, user.password);
      if (samePassword) {
        return res.status(400).json({
          message: "New password must be different from current password",
        });
      }

      const hashedPassword = await hashPassword(newPassword);

      user.password = hashedPassword;
      await user.save();

      return res.status(200).json({
        message: "Password updated successfully",
      });
    } catch (err) {
      return res.status(500).json({
        message: "Error while updating password: " + err,
      });
    }
  },
};
