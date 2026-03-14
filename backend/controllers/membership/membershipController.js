import { Op } from "sequelize";
import {
  Membership,
  Membership_Type,
  Gym,
  User,
  Trainer_Assignment,
} from "../../models/index.js";

const ACTIVE_MEMBERSHIP_STATUSES = ["active", "paused"];

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());

const expireOutdatedMemberships = async (clientId = null) => {
  const where = {
    status: "active",
    end_date: {
      [Op.lt]: new Date(),
    },
  };

  if (clientId) {
    where.client_id = clientId;
  }

  await Membership.update({ status: "expired" }, { where });
};

const canManageGym = async (requester, gymId) => {
  if (requester.role === "gym_admin") {
    const managedGym = await Gym.findOne({
      where: { gym_id: gymId, admin_user_id: requester.user_id },
    });
    return Boolean(managedGym);
  }

  if (requester.role === "front_desk") {
    return Number(requester.gym_id) === Number(gymId);
  }

  return false;
};

export const controller = {
  getMembershipTypesByGym: async (req, res) => {
    try {
      const { gymId } = req.params;
      const gym = await Gym.findByPk(gymId);

      if (!gym) {
        return res.status(404).send("Gym not found");
      }

      const types = await Membership_Type.findAll({
        where: { gym_id: gymId, is_active: true },
        order: [
          ["price", "ASC"],
          ["duration_days", "ASC"],
        ],
      });

      return res.status(200).json(types);
    } catch (err) {
      return res.status(500).send("Error fetching membership types: " + err);
    }
  },

  getMembershipTypesForManagedGym: async (req, res) => {
    try {
      const { gymId } = req.params;
      const canManage = await canManageGym(req.user, gymId);

      if (!canManage) {
        return res.status(403).send("You cannot manage membership types for this gym");
      }

      const types = await Membership_Type.findAll({
        where: { gym_id: gymId },
        order: [["membership_type_id", "DESC"]],
      });

      return res.status(200).json(types);
    } catch (err) {
      return res.status(500).send("Error fetching managed membership types: " + err);
    }
  },

  createMembershipType: async (req, res) => {
    try {
      const {
        gym_id,
        name,
        description,
        duration_days,
        price,
        includes_group_classes = false,
        freeze_days = 0,
        is_active = true,
      } = req.body;

      if (!gym_id || !name || !duration_days || price === undefined) {
        return res.status(400).send("Missing required fields");
      }

      if (Number(duration_days) <= 0 || Number(price) < 0 || Number(freeze_days) < 0) {
        return res.status(400).send("Invalid membership type values");
      }

      const canManage = await canManageGym(req.user, gym_id);
      if (!canManage) {
        return res.status(403).send("You cannot create membership types for this gym");
      }

      const type = await Membership_Type.create({
        gym_id,
        name,
        description: description || null,
        duration_days,
        price,
        includes_group_classes,
        freeze_days,
        is_active,
      });

      return res.status(201).json(type);
    } catch (err) {
      return res.status(500).send("Error creating membership type: " + err);
    }
  },

  updateMembershipType: async (req, res) => {
    try {
      const { membershipTypeId } = req.params;
      const type = await Membership_Type.findByPk(membershipTypeId);

      if (!type) {
        return res.status(404).send("Membership type not found");
      }

      const canManage = await canManageGym(req.user, type.gym_id);
      if (!canManage) {
        return res.status(403).send("You cannot update membership types for this gym");
      }

      const updates = {};
      const allowedFields = [
        "name",
        "description",
        "duration_days",
        "price",
        "includes_group_classes",
        "freeze_days",
        "is_active",
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (
        (updates.duration_days !== undefined && Number(updates.duration_days) <= 0) ||
        (updates.price !== undefined && Number(updates.price) < 0) ||
        (updates.freeze_days !== undefined && Number(updates.freeze_days) < 0)
      ) {
        return res.status(400).send("Invalid membership type values");
      }

      await type.update(updates);

      return res.status(200).json(type);
    } catch (err) {
      return res.status(500).send("Error updating membership type: " + err);
    }
  },

  issueMembership: async (req, res) => {
    try {
      const { client_id, membership_type_id, payment_method, start_date } = req.body;

      if (!client_id || !membership_type_id || !payment_method) {
        return res.status(400).send("Missing required fields");
      }

      const membershipType = await Membership_Type.findOne({
        where: { membership_type_id, is_active: true },
      });

      if (!membershipType) {
        return res.status(404).send("Membership type not found");
      }

      const canManage = await canManageGym(req.user, membershipType.gym_id);
      if (!canManage) {
        return res.status(403).send("You cannot issue memberships for this gym");
      }

      const client = await User.findByPk(client_id);
      if (!client || client.role !== "client") {
        return res.status(404).send("Client not found");
      }

      if (start_date && !isValidDate(start_date)) {
        return res.status(400).send("Invalid start date");
      }

      await expireOutdatedMemberships(client_id);

      const currentMembership = await Membership.findOne({
        where: {
          client_id,
          status: {
            [Op.in]: ACTIVE_MEMBERSHIP_STATUSES,
          },
        },
        include: {
          model: Membership_Type,
          attributes: ["gym_id"],
        },
        order: [["start_date", "DESC"]],
      });

      if (currentMembership) {
        await currentMembership.update({
          status: "cancelled",
          end_date: new Date(),
          cancelled_reason: "Replaced by a new membership issued at reception",
        });
      }

      const startDate = start_date ? new Date(start_date) : new Date();
      const endDate = addDays(startDate, membershipType.duration_days);
      const isChangingGym =
        client.gym_id && Number(client.gym_id) !== Number(membershipType.gym_id);

      const membership = await Membership.create({
        client_id,
        membership_type_id,
        start_date: startDate,
        end_date: endDate,
        status: "active",
        payment_method,
        remaining_freeze_days: membershipType.freeze_days,
      });

      if (isChangingGym) {
        await Trainer_Assignment.update(
          { status: "ended" },
          { where: { client_id, status: "accepted" } },
        );
      }

      await User.update(
        { gym_id: membershipType.gym_id },
        { where: { user_id: client_id } },
      );

      const createdMembership = await Membership.findByPk(membership.membership_id, {
        include: [
          {
            model: Membership_Type,
            include: [{ model: Gym }],
          },
        ],
      });

      return res.status(201).json(createdMembership);
    } catch (err) {
      return res.status(500).send("Error issuing membership: " + err);
    }
  },

  getMyCurrentMembership: async (req, res) => {
    try {
      await expireOutdatedMemberships(req.user.user_id);

      const membership = await Membership.findOne({
        where: {
          client_id: req.user.user_id,
          status: {
            [Op.in]: ACTIVE_MEMBERSHIP_STATUSES,
          },
        },
        include: [
          {
            model: Membership_Type,
            include: [{ model: Gym }],
          },
        ],
        order: [["start_date", "DESC"]],
      });

      if (!membership) {
        return res.status(404).send("No current membership found");
      }

      return res.status(200).json(membership);
    } catch (err) {
      return res.status(500).send("Error fetching current membership: " + err);
    }
  },

  getMyMembershipHistory: async (req, res) => {
    try {
      await expireOutdatedMemberships(req.user.user_id);

      const memberships = await Membership.findAll({
        where: { client_id: req.user.user_id },
        include: [
          {
            model: Membership_Type,
            include: [{ model: Gym }],
          },
        ],
        order: [["start_date", "DESC"]],
      });

      return res.status(200).json(memberships);
    } catch (err) {
      return res.status(500).send("Error fetching membership history: " + err);
    }
  },
};
