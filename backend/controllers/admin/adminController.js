import crypto from "crypto";
import bcrypt from "bcrypt";
import { User, Reset_Token, Gym } from "../../models/index.js";
import { transporter } from "../../config/mail.js";
import { Op } from "sequelize";

const geocodeAddress = async (address) => {
  const encoded = encodeURIComponent(address);
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`,
  );
  const data = await res.json();
  console.log("Geocode status:", data.status);
  console.log("Geocode error:", data.error_message);
  if (data.status === "OK") {
    const { lat, lng } = data.results[0].geometry.location;
    return { latitude: lat, longitude: lng };
  }
  return null;
};
export const controller = {
  createTrainer: async (req, res) => {
    try {
      const requester = req.user;
      if (requester.role !== "gym_admin") {
        return res
          .status(403)
          .json({ message: "Only gym admin can create trainers" });
      }
      const { gym_id, email, first_name, last_name, phone } = req.body;
      if (!gym_id || !email || !first_name || !last_name || !phone) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const gym = await Gym.findOne({
        where: { gym_id, admin_user_id: requester.user_id },
      });
      if (!gym) {
        return res.status(403).json({ message: "You do not manage this gym" });
      }
      const existing = await User.findOne({
        where: {
          [Op.or]: [{ email }, { phone }],
        },
      });
      if (existing) {
        if (existing.email === email) {
          return res.status(409).json({ message: "Email already used" });
        }

        if (existing.phone === phone) {
          return res.status(409).json({ message: "Phone number already used" });
        }
      }
      const tempPassword = crypto.randomBytes(16).toString("hex");
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const trainer = await User.create({
        email,
        password: hashedPassword,
        first_name,
        last_name,
        role: "trainer",
        phone,
        gym_id: gym_id,
        registration_date: new Date(),
        is_active: false,
      });
      const token = crypto.randomBytes(32).toString("hex");
      const token_hash = await bcrypt.hash(token, 10);
      await Reset_Token.create({
        user_id: trainer.user_id,
        token_hash,
        expires_at: new Date(Date.now() + 1000 * 60 * 60), //intr o ora
      });
      const resetLink = `${process.env.CLIENT_URL}/set-password?token=${token}&userId=${trainer.user_id}`;
      await transporter.sendMail({
        to: trainer.email,
        subject: "Set your password - Fitness App",
        html: `
                     <p>Hello ${trainer.first_name},</p>
          <p>Your trainer account has been created.</p>
          <p>Please set your password by clicking the link below:</p>
          <a href="${resetLink}">Set Password</a>
          <p>This link expires in 1 hour.</p>
                    `,
      });
      return res
        .status(201)
        .json({ message: "Trainer created and email sent" });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error creating trainer: " + err });
    }
  },
  createGym: async (req, res) => {
    try {
      const { name, address, max_capacity, opening_time, closing_time } =
        req.body;

      if (
        !name ||
        !address ||
        !max_capacity ||
        !opening_time ||
        !closing_time
      ) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const coords = await geocodeAddress(address);

      const gym = await Gym.create({
        name,
        address,
        max_capacity,
        opening_time,
        closing_time,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        admin_user_id: req.user.user_id,
      });

      return res.status(201).json(gym);
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error while creating gym: " + err });
    }
  },
  getMyGyms: async (req, res) => {
    try {
      const gyms = await Gym.findAll({
        where: { admin_user_id: req.user.user_id },
      });
      return res.status(200).json(gyms);
    } catch (err) {
      return res.status(500).json({ message: "Error: " + err });
    }
  },

  updateGym: async (req, res) => {
    try {
      const { gymId } = req.params;
      const gym = await Gym.findOne({
        where: { gym_id: gymId, admin_user_id: req.user.user_id },
      });

      if (!gym) {
        return res
          .status(404)
          .json({ message: "Gym not found or you do not manage it" });
      }

      const updates = {};
      const allowedFields = [
        "name",
        "address",
        "max_capacity",
        "opening_time",
        "closing_time",
      ];
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (updates.address) {
        const coords = await geocodeAddress(updates.address);
        if (coords) {
          updates.latitude = coords.latitude;
          updates.longitude = coords.longitude;
        }
      }

      await gym.update(updates);
      return res.status(200).json(gym);
    } catch (err) {
      return res.status(500).json({ message: "Error updating gym: " + err });
    }
  },
  deleteGym: async (req, res) => {
    try {
      const { gymId } = req.params;
      const gym = await Gym.findOne({
        where: { gym_id: gymId, admin_user_id: req.user.user_id },
      });
      if (!gym) {
        return res
          .status(404)
          .json({ message: "Gym not found or you do not manage it" });
      }

      await gym.destroy();
      return res.status(200).json({ message: "Gym deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Error deleting gym: " + err });
    }
  },

  getAllGyms: async (req, res) => {
    try {
      const { search } = req.query;
      const where = search
        ? {
            [Op.or]: [
              { name: { [Op.like]: `%${search}%` } },
              { address: { [Op.like]: `%${search}%` } },
            ],
          }
        : {};
      const gyms = await Gym.findAll({
        where,
        attributes: [
          "gym_id",
          "name",
          "address",
          "opening_time",
          "closing_time",
          "max_capacity",
          "latitude",
          "longitude",
        ],
      });
      return res.status(200).json(gyms);
    } catch (err) {
      return res.status(500).json({ message: "Error: " + err });
    }
  },

  updateTrainer: async (req, res) => {
    try {
      const { trainerId } = req.params;
      const trainer = await User.findOne({
        where: { user_id: trainerId, role: "trainer" },
      });
      if (!trainer) {
        return res.status(404).json({ message: "Trainer not found" });
      }

      const gym = await Gym.findOne({
        where: { gym_id: trainer.gym_id, admin_user_id: req.user.user_id },
      });
      if (!gym) {
        return res
          .status(403)
          .json({ message: "You do not manage this trainer's gym" });
      }

      const updates = {};
      const allowedFields = ["first_name", "last_name", "phone", "is_active"];
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (updates.phone) {
        const existing = await User.findOne({
          where: { phone: updates.phone },
        });
        if (existing && existing.user_id !== trainer.user_id) {
          return res.status(409).json({ message: "Phone number already used" });
        }
      }

      await trainer.update(updates);
      return res.status(200).json(trainer);
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error updating trainer: " + err });
    }
  },

  deleteTrainer: async (req, res) => {
    try {
      const { trainerId } = req.params;
      const trainer = await User.findOne({
        where: { user_id: trainerId, role: "trainer" },
      });
      if (!trainer) {
        return res.status(404).json({ message: "Trainer not found" });
      }

      const gym = await Gym.findOne({
        where: { gym_id: trainer.gym_id, admin_user_id: req.user.user_id },
      });
      if (!gym) {
        return res
          .status(403)
          .json({ message: "You do not manage this trainer's gym" });
      }

      await trainer.update({ is_active: false });
      return res.status(200).json({ message: "Trainer deactivated" });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error deactivating trainer: " + err });
    }
  },
};
