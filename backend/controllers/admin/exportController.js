import {
  User,
  Gym,
  Membership,
  Membership_Type,
  Gym_Attendance,
} from "../../models/index.js";
import { Op } from "sequelize";

function escapeCSV(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const needsQuoting = str.includes(",") || str.includes('"') || str.includes("\n");
  if (needsQuoting) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(headers, rows) {
  const headerLine = headers.join(",");
  const dataLines = rows.map((row) => row.map(escapeCSV).join(","));
  return [headerLine, ...dataLines].join("\n");
}

function fmtDate(d) {
  return d ? new Date(d).toISOString().split("T")[0] : "";
}

function fmtTime(d) {
  return d
    ? new Date(d).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

async function checkGymAccess(gymId, userId) {
  return Gym.findOne({ where: { gym_id: gymId, admin_user_id: userId } });
}

export const controller = {
  exportMemberships: async (req, res) => {
    try {
      const { gymId } = req.params;
      if (!(await checkGymAccess(gymId, req.user.user_id))) {
        return res.status(403).json({ message: "You do not manage this gym" });
      }

      const rows = await Membership.findAll({
        include: [
          { model: User, attributes: ["first_name", "last_name", "email"] },
          {
            model: Membership_Type,
            attributes: ["name", "price"],
            where: { gym_id: gymId },
            required: true,
          },
        ],
        order: [["start_date", "DESC"]],
      });

      const headers = [
        "Client Name",
        "Email",
        "Membership Type",
        "Price",
        "Start Date",
        "End Date",
        "Status",
      ];
      const data = rows.map((r) => [
        r.User ? `${r.User.first_name} ${r.User.last_name}` : "",
        r.User?.email || "",
        r.Membership_Type?.name || "",
        r.Membership_Type?.price ?? "",
        fmtDate(r.start_date),
        fmtDate(r.end_date),
        r.status,
      ]);

      const csv = toCSV(headers, data);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="memberships_${todayStr()}.csv"`,
      );
      return res.send(csv);
    } catch (err) {
      return res.status(500).json({ message: "Export failed: " + err.message });
    }
  },

  exportUsers: async (req, res) => {
    try {
      const { gymId } = req.params;
      if (!(await checkGymAccess(gymId, req.user.user_id))) {
        return res.status(403).json({ message: "You do not manage this gym" });
      }

      const users = await User.findAll({
        where: { gym_id: gymId },
        attributes: [
          "first_name",
          "last_name",
          "email",
          "phone",
          "role",
          "is_active",
        ],
        order: [["first_name", "ASC"]],
      });

      const headers = [
        "First Name",
        "Last Name",
        "Email",
        "Phone",
        "Role",
        "Active",
      ];
      const data = users.map((u) => [
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role,
        u.is_active ? "Yes" : "No",
      ]);

      const csv = toCSV(headers, data);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="users_${todayStr()}.csv"`,
      );
      return res.send(csv);
    } catch (err) {
      return res.status(500).json({ message: "Export failed: " + err.message });
    }
  },

  exportCheckins: async (req, res) => {
    try {
      const { gymId } = req.params;
      const { from, to } = req.query;

      if (!(await checkGymAccess(gymId, req.user.user_id))) {
        return res.status(403).json({ message: "You do not manage this gym" });
      }

      const where = { gym_id: gymId };
      if (from || to) {
        where.entry_time = {};
        if (from) where.entry_time[Op.gte] = new Date(from);
        if (to) {
          const toDate = new Date(to);
          toDate.setDate(toDate.getDate() + 1);
          where.entry_time[Op.lt] = toDate;
        }
      }

      const rows = await Gym_Attendance.findAll({
        where,
        include: [
          { model: User, attributes: ["first_name", "last_name", "email"] },
        ],
        order: [["entry_time", "DESC"]],
      });

      const headers = ["Client Name", "Email", "Date", "Time"];
      const data = rows.map((r) => [
        r.User ? `${r.User.first_name} ${r.User.last_name}` : "",
        r.User?.email || "",
        fmtDate(r.entry_time),
        fmtTime(r.entry_time),
      ]);

      const csv = toCSV(headers, data);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="checkins_${todayStr()}.csv"`,
      );
      return res.send(csv);
    } catch (err) {
      return res.status(500).json({ message: "Export failed: " + err.message });
    }
  },
};
