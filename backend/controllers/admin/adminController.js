import crypto from "crypto";
import bcrypt from "bcrypt";
import {
  User,
  Reset_Token,
  Gym,
  Gym_Attendance,
  Membership,
  Membership_Type,
  Class_Enrollment,
  Class_Session,
  Class_Type,
} from "../../models/index.js";
import { transporter } from "../../config/mail.js";
import { Op, fn, col, literal } from "sequelize";
import { sourceMapsEnabled } from "process";

const geocodeAddress = async (address) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  try {
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
    console.warn(`[geocode] No results for address: "${address}"`);
    return null;
  } catch (err) {
    console.error(`[geocode] Failed for address "${address}":`, err.message);
    return null;
  }
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
      const existingByEmail = await User.findOne({ where: { email } });
      const existingByPhone = await User.findOne({ where: { phone } });

      // A pending invite that was never activated (e.g. the reset link/OTP
      // expired before the trainer set their password, or the admin removed
      // the never-activated invite) shouldn't permanently block re-inviting
      // that same email - reuse and reset that account instead of
      // hard-blocking on it forever.
      const reinvite =
        existingByEmail &&
        existingByEmail.role === "trainer" &&
        !existingByEmail.is_active;

      if (!reinvite && existingByEmail) {
        return res.status(409).json({ message: "Email already used" });
      }
      if (
        existingByPhone &&
        (!reinvite || existingByPhone.user_id !== existingByEmail.user_id)
      ) {
        return res.status(409).json({ message: "Phone number already used" });
      }

      const tempPassword = crypto.randomBytes(16).toString("hex");
      const token = crypto.randomBytes(32).toString("hex");
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      const [hashedPassword, token_hash] = await Promise.all([
        bcrypt.hash(tempPassword, 10),
        bcrypt.hash(token, 10),
      ]);

      let trainer;
      if (reinvite) {
        trainer = existingByEmail;
        await trainer.update({
          password: hashedPassword,
          first_name,
          last_name,
          phone,
          gym_id,
          removed_from_staff: false,
        });
        await Reset_Token.destroy({ where: { user_id: trainer.user_id } });
      } else {
        trainer = await User.create({
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
      }

      await Reset_Token.create({
        user_id: trainer.user_id,
        token_hash,
        otp,
        expires_at: new Date(Date.now() + 1000 * 60 * 60),
      });

      const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}&userId=${trainer.user_id}`;
      transporter
        .sendMail({
          from: "Kinetic Fitness",
          to: trainer.email,
          subject: "Ai fost invitat ca antrenor - setează-ți parola",
          html: `
          <p>Salut ${trainer.first_name},</p>
          <p>Contul tău de <strong>antrenor</strong> pe <strong>Kinetic</strong> a fost creat.</p>
          <p>Dacă folosești <strong>aplicația mobilă</strong>, introdu acest cod când ți se solicită:</p>
          <p style="font-size:36px; font-weight:bold; letter-spacing:10px; margin:16px 0;">${otp}</p>
          <p>Codul este valabil <strong>1 oră</strong>.</p>
          <hr style="margin:24px 0; border:none; border-top:1px solid #eee;" />
          <p>Dacă ești pe <strong>web</strong>, apasă linkul de mai jos pentru a-ți seta parola:</p>
          <p><a href="${resetLink}" style="font-weight:bold;">Setează parola</a></p>
        `,
        })
        .catch((err) =>
          console.error(
            "Eroare la trimiterea emailului de invitație antrenor:",
            err,
          ),
        );

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

      await User.update(
        { gym_id: gym.gym_id },
        { where: { user_id: req.user.user_id } },
      );

      return res.status(201).json({ ...gym.toJSON(), geocoded: !!coords });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error while creating gym: " + err });
    }
  },
  getStaff: async (req, res) => {
    try {
      const { gymId } = req.params;
      const gym = await Gym.findOne({ where: { gym_id: gymId, admin_user_id: req.user.user_id } });
      if (!gym) return res.status(403).json({ message: "You do not manage this gym" });

      const staff = await User.findAll({
        where: { gym_id: gymId, role: ["trainer", "front_desk"], removed_from_staff: false },
        attributes: ["user_id", "first_name", "last_name", "email", "role", "phone", "is_active"],
      });
      return res.status(200).json(staff);
    } catch (err) {
      return res.status(500).json({ message: "Error: " + err });
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

      if (!trainer.is_active) {
        await trainer.update({ removed_from_staff: true });
        return res.status(200).json({ message: "Trainer removed" });
      }

      await trainer.update({ is_active: false });
      return res.status(200).json({ message: "Trainer deactivated" });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error deactivating trainer: " + err });
    }
  },

  createFrontDesk: async (req, res) => {
    try {
      const requester = req.user;
      if (requester.role !== "gym_admin") {
        return res
          .status(403)
          .json({ message: "Only gym admin can create front desk accounts" });
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

      const existingByEmail = await User.findOne({ where: { email } });
      const existingByPhone = await User.findOne({ where: { phone } });

      // A pending invite that was never activated (e.g. the reset link/OTP
      // expired before the front desk user set their password, or the admin
      // removed the never-activated invite) shouldn't permanently block
      // re-inviting that same email - reuse and reset that account instead
      // of hard-blocking on it forever.
      const reinvite =
        existingByEmail &&
        existingByEmail.role === "front_desk" &&
        !existingByEmail.is_active;

      if (!reinvite && existingByEmail) {
        return res.status(409).json({ message: "Email already used" });
      }
      if (
        existingByPhone &&
        (!reinvite || existingByPhone.user_id !== existingByEmail.user_id)
      ) {
        return res.status(409).json({ message: "Phone number already used" });
      }

      const tempPassword = crypto.randomBytes(16).toString("hex");
      const token = crypto.randomBytes(32).toString("hex");
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      const [hashedPassword, token_hash] = await Promise.all([
        bcrypt.hash(tempPassword, 10),
        bcrypt.hash(token, 10),
      ]);

      let frontDesk;
      if (reinvite) {
        frontDesk = existingByEmail;
        await frontDesk.update({
          password: hashedPassword,
          first_name,
          last_name,
          phone,
          gym_id,
          removed_from_staff: false,
        });
        await Reset_Token.destroy({ where: { user_id: frontDesk.user_id } });
      } else {
        frontDesk = await User.create({
          email,
          password: hashedPassword,
          first_name,
          last_name,
          role: "front_desk",
          phone,
          gym_id,
          registration_date: new Date(),
          is_active: false,
        });
      }

      await Reset_Token.create({
        user_id: frontDesk.user_id,
        token_hash,
        otp,
        expires_at: new Date(Date.now() + 1000 * 60 * 60),
      });

      const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}&userId=${frontDesk.user_id}`;
      transporter
        .sendMail({
          from: "Kinetic Fitness",
          to: frontDesk.email,
          subject: "Ai fost invitat ca recepționer - setează-ți parola",
          html: `
          <p>Salut ${frontDesk.first_name},</p>
          <p>Contul tău de <strong>recepționer</strong> pe <strong>Kinetic</strong> a fost creat.</p>

          <p>Dacă folosești <strong>aplicația mobilă</strong>, introdu acest cod când ți se solicită:</p>
          <p style="font-size:36px; font-weight:bold; letter-spacing:10px; margin:16px 0;">${otp}</p>
          <p>Codul este valabil <strong>1 oră</strong>.</p>

          <hr style="margin:24px 0; border:none; border-top:1px solid #eee;" />

          <p>Dacă ești pe <strong>web</strong>, apasă linkul de mai jos pentru a-ți seta parola:</p>
          <p><a href="${resetLink}" style="font-weight:bold;">Setează parola</a></p>
        `,
        })
        .catch((err) =>
          console.error("Failed to send front desk invite email:", err),
        );

      return res
        .status(201)
        .json({ message: "Front desk account created and email sent" });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error creating front desk account: " + err });
    }
  },

  updateFrontDesk: async (req, res) => {
    try {
      const { userId } = req.params;
      const frontDesk = await User.findOne({
        where: { user_id: userId, role: "front_desk" },
      });
      if (!frontDesk) {
        return res.status(404).json({ message: "Front desk user not found" });
      }

      const gym = await Gym.findOne({
        where: { gym_id: frontDesk.gym_id, admin_user_id: req.user.user_id },
      });
      if (!gym) {
        return res
          .status(403)
          .json({ message: "You do not manage this user's gym" });
      }

      const updates = {};
      const allowedFields = ["first_name", "last_name", "phone", "is_active"];
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      }

      if (updates.phone) {
        const existing = await User.findOne({
          where: { phone: updates.phone },
        });
        if (existing && existing.user_id !== frontDesk.user_id) {
          return res.status(409).json({ message: "Phone number already used" });
        }
      }

      await frontDesk.update(updates);
      return res.status(200).json(frontDesk);
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error updating front desk user: " + err });
    }
  },

  deleteFrontDesk: async (req, res) => {
    try {
      const { userId } = req.params;
      const frontDesk = await User.findOne({
        where: { user_id: userId, role: "front_desk" },
      });
      if (!frontDesk) {
        return res.status(404).json({ message: "Front desk user not found" });
      }

      const gym = await Gym.findOne({
        where: { gym_id: frontDesk.gym_id, admin_user_id: req.user.user_id },
      });
      if (!gym) {
        return res
          .status(403)
          .json({ message: "You do not manage this user's gym" });
      }

      if (!frontDesk.is_active) {
        await frontDesk.update({ removed_from_staff: true });
        return res.status(200).json({ message: "Front desk user removed" });
      }

      await frontDesk.update({ is_active: false });
      return res.status(200).json({ message: "Front desk user deactivated" });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error deactivating front desk user: " + err });
    }
  },

  getAttendanceStats: async (req, res) => {
    try {
      const { gymId } = req.params;
      const { date } = req.query; // optional YYYY-MM-DD for hourly view

      const gym = await Gym.findOne({
        where: { gym_id: gymId, admin_user_id: req.user.user_id },
      });
      if (!gym)
        return res.status(403).json({ message: "You do not manage this gym" });

      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const weekStart = new Date(
        todayStart.getTime() - dayOfWeek * 24 * 60 * 60 * 1000,
      );
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
        where: {
          gym_id: gymId,
          entry_time: { [Op.gte]: todayStart, [Op.lt]: todayEnd },
        },
      });
      const selRowsPromise = sameDay
        ? todayRowsPromise
        : Gym_Attendance.findAll({
            where: {
              gym_id: gymId,
              entry_time: { [Op.gte]: selStart, [Op.lt]: selEnd },
            },
          });

      const [todayRows, weekRows, selRows, recentRows] = await Promise.all([
        todayRowsPromise,
        Gym_Attendance.findAll({
          where: {
            gym_id: gymId,
            entry_time: { [Op.gte]: weekStart, [Op.lt]: weekEnd },
          },
          include: [
            {
              model: User,
              attributes: ["user_id", "first_name", "last_name", "email"],
            },
          ],
        }),
        selRowsPromise,
        Gym_Attendance.findAll({
          where: { gym_id: gymId },
          include: [
            {
              model: User,
              attributes: ["user_id", "first_name", "last_name", "email"],
            },
          ],
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

      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const liveCount = todayRows.filter(
        (r) => new Date(r.entry_time) >= twoHoursAgo,
      ).length;

      return res.status(200).json({
        today: todayRows.length,
        thisWeek: weekRows.length,
        uniqueThisWeek,
        avgPerDay,
        liveCount,
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
      return res
        .status(500)
        .json({ message: "Error fetching attendance stats: " + err });
    }
  },

  getRevenueStats: async (req, res) => {
    try {
      const { gymId } = req.params;
      const gym = await Gym.findOne({
        where: { gym_id: gymId, admin_user_id: req.user.user_id },
      });
      if (!gym)
        return res.status(403).json({ message: "You do not manage this gym" });

      const now = new Date();

      const activeMemberships = await Membership.findAll({
        where: { status: { [Op.in]: ["active", "paused"] } },
        include: [
          {
            model: Membership_Type,
            where: { gym_id: gymId },
            attributes: ["price", "name", "duration_days"],
          },
        ],
      });

      const mrr = activeMemberships.reduce((sum, m) => {
        const dailyRate =
          (m.Membership_Type?.price || 0) /
          (m.Membership_Type?.duration_days || 30);
        return sum + dailyRate * 30;
      }, 0);

      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const allRecent = await Membership.findAll({
        where: { start_date: { [Op.gte]: sixMonthsAgo } },
        include: [
          {
            model: Membership_Type,
            where: { gym_id: gymId },
            attributes: ["price"],
          },
        ],
      });

      const monthly = Array(6).fill(0);
      for (const m of allRecent) {
        const d = new Date(m.start_date);
        const diffMonths =
          (now.getFullYear() - d.getFullYear()) * 12 +
          (now.getMonth() - d.getMonth());
        const idx = 5 - diffMonths;
        if (idx >= 0 && idx < 6) monthly[idx] += m.Membership_Type?.price || 0;
      }

      return res.status(200).json({
        mrr: Math.round(mrr),
        currentMonthRevenue: monthly[5] || 0,
        activeMemberships: activeMemberships.length,
        monthly,
      });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error fetching revenue stats: " + err });
    }
  },

  getClientNoShows: async (req, res) => {
    try {
      const { clientId } = req.params;
      const gymId = req.user.gym_id;
      if (!gymId)
        return res.status(403).json({ message: "Not associated with a gym" });

      // Sync expired sessions first - same step the enrollment check runs
      const { syncExpiredNoShows } = await import("../../utils/syncNoShow.js");
      await syncExpiredNoShows();

      const noShows = await Class_Enrollment.findAll({
        where: { client_id: clientId, status: "no_show" },
        include: [
          {
            model: Class_Session,
            required: true,
            where: { gym_id: gymId },
            include: [{ model: Class_Type, attributes: ["name"] }],
            attributes: ["session_id", "start_datetime"],
          },
        ],
        order: [[Class_Session, "start_datetime", "DESC"]],
      });

      const membership = await Membership.findOne({
        where: { client_id: clientId },
        include: [{ model: Membership_Type, where: { gym_id: gymId }, attributes: [] }],
        order: [["start_date", "DESC"]],
        attributes: ["status", "cancelled_reason"],
      });

      return res.json({
        count: noShows.length,
        blocked: noShows.length >= 3,
        membership_status: membership?.status ?? null,
        cancelled_reason: membership?.cancelled_reason ?? null,
        no_shows: noShows.map((e) => ({
          enrollment_id: e.enrollment_id,
          class_name: e.Class_Session?.Class_Type?.name ?? "Clasă",
          start_datetime: e.Class_Session?.start_datetime,
        })),
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  clearClientNoShows: async (req, res) => {
    try {
      const { clientId } = req.params;
      const gymId = req.user.gym_id;
      if (!gymId)
        return res.status(403).json({ message: "Not associated with a gym" });

      // Find only this gym's no-shows
      const noShows = await Class_Enrollment.findAll({
        where: { client_id: clientId, status: "no_show" },
        include: [
          {
            model: Class_Session,
            required: true,
            where: { gym_id: gymId },
            attributes: ["session_id"],
          },
        ],
        attributes: ["enrollment_id"],
      });

      if (!noShows.length) {
        return res.json({ message: "No no-shows to clear", cleared: 0 });
      }

      // Soft-cancel: keeps the record in history but removes it from the block count
      await Class_Enrollment.update(
        { status: "cancelled" },
        {
          where: {
            enrollment_id: { [Op.in]: noShows.map((e) => e.enrollment_id) },
          },
        },
      );

      return res.json({ message: "No-shows cleared", cleared: noShows.length });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
};
