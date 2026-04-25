import crypto from "crypto";
import bcrypt from "bcrypt";
import { User, Reset_Token, Gym, Gym_Attendance, Membership, Membership_Type } from "../../models/index.js";
import { transporter } from "../../config/mail.js";
import { Op, fn, col, literal } from "sequelize";
import { sourceMapsEnabled } from "process";

const geocodeAddress = async (address) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const encoded = encodeURIComponent(address);

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
    {
      headers: {
        "User-Agent": "KineticFitnessApp/1.0",
        Accept: "application/json",
      },
    },
  );
  const data = await res.json();

  if (data.length > 0) {
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
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
      const token = crypto.randomBytes(32).toString("hex");
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      const [hashedPassword, token_hash] = await Promise.all([
        bcrypt.hash(tempPassword, 10),
        bcrypt.hash(token, 10),
      ]);

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

      await Reset_Token.create({
        user_id: trainer.user_id,
        token_hash,
        otp,
        expires_at: new Date(Date.now() + 1000 * 60 * 60),
      });

      const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}&userId=${trainer.user_id}`;
      transporter.sendMail({
        from: "Kinetic Fitness",
        to: trainer.email,
        subject: "You've been invited as a trainer — set your password",
        html: `
          <p>Hi ${trainer.first_name},</p>
          <p>Your trainer account on <strong>Kinetic</strong> has been created.</p>

          <p>If you're using the <strong>mobile app</strong>, enter this code when prompted:</p>
          <p style="font-size:36px; font-weight:bold; letter-spacing:10px; margin:16px 0;">${otp}</p>
          <p>The code is valid for <strong>1 hour</strong>.</p>

          <hr style="margin:24px 0; border:none; border-top:1px solid #eee;" />

          <p>If you're on <strong>web</strong>, click the link below to set your password:</p>
          <p><a href="${resetLink}" style="font-weight:bold;">Set my password</a></p>
        `,
      }).catch((err) => console.error("Failed to send trainer invite email:", err));

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

  getAttendanceStats: async (req, res) => {
    try {
      const { gymId } = req.params;
      const { date } = req.query; // optional YYYY-MM-DD for hourly view

      const gym = await Gym.findOne({ where: { gym_id: gymId, admin_user_id: req.user.user_id } });
      if (!gym) return res.status(403).json({ message: "You do not manage this gym" });

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const weekStart = new Date(todayStart.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Parse selected date for hourly chart (defaults to today)
      let selStart = todayStart;
      let selEnd = todayEnd;
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [y, m, d] = date.split("-").map(Number);
        selStart = new Date(y, m - 1, d);
        selEnd = new Date(selStart.getTime() + 24 * 60 * 60 * 1000);
      }

      const sameDay = selStart.getTime() === todayStart.getTime();
      const todayRowsPromise = Gym_Attendance.findAll({
        where: { gym_id: gymId, entry_time: { [Op.gte]: todayStart, [Op.lt]: todayEnd } },
      });
      const selRowsPromise = sameDay
        ? todayRowsPromise
        : Gym_Attendance.findAll({
            where: { gym_id: gymId, entry_time: { [Op.gte]: selStart, [Op.lt]: selEnd } },
          });

      const [todayRows, weekRows, selRows, recentRows] = await Promise.all([
        todayRowsPromise,
        Gym_Attendance.findAll({
          where: { gym_id: gymId, entry_time: { [Op.gte]: weekStart, [Op.lt]: weekEnd } },
          include: [{ model: User, attributes: ["user_id", "first_name", "last_name", "email"] }],
        }),
        selRowsPromise,
        Gym_Attendance.findAll({
          where: { gym_id: gymId },
          include: [{ model: User, attributes: ["user_id", "first_name", "last_name", "email"] }],
          order: [["entry_time", "DESC"]],
          limit: 20,
        }),
      ]);

      const hourly = Array(24).fill(0);
      for (const row of selRows) {
        hourly[new Date(row.entry_time).getHours()]++;
      }

      const daily = Array(7).fill(0);
      for (const row of weekRows) {
        const d = new Date(row.entry_time).getDay();
        daily[d === 0 ? 6 : d - 1]++;
      }

      const uniqueThisWeek = new Set(weekRows.map((r) => r.user_id)).size;
      const daysElapsed = Math.max(1, dayOfWeek + 1);
      const avgPerDay = Math.round(weekRows.length / daysElapsed);

      return res.status(200).json({
        today: todayRows.length,
        thisWeek: weekRows.length,
        uniqueThisWeek,
        avgPerDay,
        hourlyDate: selStart.toISOString().split("T")[0],
        hourlyTotal: selRows.length,
        hourly,
        daily,
        recent: recentRows.map((r) => ({
          user_id: r.user_id,
          name: r.User ? `${r.User.first_name} ${r.User.last_name}` : "Unknown",
          email: r.User?.email || "",
          entry_time: r.entry_time,
        })),
      });
    } catch (err) {
      return res.status(500).json({ message: "Error fetching attendance stats: " + err });
    }
  },

  getRevenueStats: async (req, res) => {
    try {
      const { gymId } = req.params;
      const gym = await Gym.findOne({ where: { gym_id: gymId, admin_user_id: req.user.user_id } });
      if (!gym) return res.status(403).json({ message: "You do not manage this gym" });

      const now = new Date();

      const activeMemberships = await Membership.findAll({
        where: { status: "active" },
        include: [{ model: Membership_Type, where: { gym_id: gymId }, attributes: ["price", "name", "duration_days"] }],
      });

      const mrr = activeMemberships.reduce((sum, m) => {
        const dailyRate = (m.Membership_Type?.price || 0) / (m.Membership_Type?.duration_days || 30);
        return sum + dailyRate * 30;
      }, 0);

      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const allRecent = await Membership.findAll({
        where: { start_date: { [Op.gte]: sixMonthsAgo } },
        include: [{ model: Membership_Type, where: { gym_id: gymId }, attributes: ["price"] }],
      });

      const monthly = Array(6).fill(0);
      for (const m of allRecent) {
        const d = new Date(m.start_date);
        const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        const idx = 5 - diffMonths;
        if (idx >= 0 && idx < 6) monthly[idx] += m.Membership_Type?.price || 0;
      }

      return res.status(200).json({
        mrr: Math.round(mrr),
        activeMemberships: activeMemberships.length,
        monthly,
      });
    } catch (err) {
      return res.status(500).json({ message: "Error fetching revenue stats: " + err });
    }
  },
};
