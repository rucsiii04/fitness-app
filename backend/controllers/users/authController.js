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
          return res.status(409).send("Email already used");
        }

        if (existingUser.phone === phone) {
          return res.status(409).send("Phone number already used");
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
      const validePassword = await comparePassword(password, user.password);
      if (!validePassword) {
        return res.status(401).json({ messsage: "Incorrect password" });
      }
      const token = generateToken(user);

      res.status(200).json({
        token,
        user: {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
          gym_id: user.gym_id,
        },
      });
    } catch (err) {
      res.status(500).json({ message: "Login error" + err });
    }
  },
  requestPasswordReset: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user)
        return res
          .status(200)
          .send("If the email exists, you will receive reset instructions");

      const token = crypto.randomBytes(32).toString("hex");
      const token_hash = await bcrypt.hash(token, 10);
      await Reset_Token.update(
        {
          used: true,
        },
        { where: { user_id: user.user_id, used: false } },
      );
      await Reset_Token.create({
        user_id: user.user_id,
        token_hash: token_hash,
        expires_at: new Date(Date.now() + 1000 * 60 * 30), //30 min
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
  <p>Link ul este valabil 30 de minute.</p>
  `,
      });

      return res.status(200).json({
        message: "If the email exists, you will receive reset instructions",
      });
    } catch (err) {
      res.status(500).json({ message: "Reset error:" + err });
    }
  },
  resetPassword: async (req, res) => {
    try {
      const { userId, token, newPassword } = req.body;
      if (!userId || !token || !newPassword) {
        return res.status(400).send("Missing required fields");
      }
      const resetToken = await Reset_Token.findOne({
        where: { used: false, user_id: userId },
      });
      if (!resetToken) return res.status(400).send("Invalid or expired token");
      if (resetToken.expires_at < new Date()) {
        return res.status(400).send("Token expired");
      }
      const valid = await bcrypt.compare(token, resetToken.token_hash);
      if (!valid) {
        return res.status(400).send("Invalid token");
      }
      const hashedPassord = await hashPassword(newPassword);
      await User.update(
        { password: hashedPassord ,is_active:true},
        { where: { user_id: userId } },
      );
      resetToken.used = true;
      await resetToken.save();
      return res.status(200).send("Passord reset succesfully");
    } catch (err) {
      return res.status(500).send("err: " + err);
    }
  },
  updatePassword: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).send("Missing fields");
      }
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).send("User not found");
      }

      const isValid = await comparePassword(oldPassword, user.password);
      if (!isValid) {
        return res.status(400).send("Old password incorrect");
      }
      const hashedPassword = await hashPassword(newPassword);
      user.password = hashedPassword;
      await user.save();
      return res.status(200).send("Password updated succesfully");
    } catch (err) {
      return res.status(500).send("Error while updating password: " + err);
    }
  },
};
