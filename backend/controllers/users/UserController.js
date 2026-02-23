import { Op } from "sequelize";
import { User, Trainer_Assignment } from "../../models/index.js";

export const controller = {
  sendRequest: async (req, res) => {
    try {
      const requester = req.user;

      if (requester.role === "client") {
        const hasTrainer = await Trainer_Assignment.findOne({
          where: {
            client_id: requester.user_id,
            status: "accepted",
          },
        });

        if (hasTrainer) {
          return res.status(400).send("You already have an active trainer");
        }
      }
      const { targetUserId } = req.body;
      if (!targetUserId) {
        return res.status(400).send("Target user required");
      }
      const targetUser = await User.findByPk(targetUserId);
      if (!targetUser) {
        return res.status(404).send("User not found");
      }
      if (targetUser.user_id === requester.user_id) {
        return res
          .status(400)
          .send("You cannot assign yourself to be your trainer");
      }
      if (targetUser.gym_id !== requester.gym_id) {
        return res.status(400).send("Users must belong to the same gym");
      }
      if (!targetUser.is_active) {
        return res.status(400).send("Target user is not active");
      }
      let trainerId, clientId;
      if (requester.role === "trainer" && targetUser.role == "client") {
        trainerId = requester.user_id;
        clientId = targetUser.user_id;
      } else if (requester.role === "client" && targetUser.role === "trainer") {
        trainerId = targetUser.user_id;
        clientId = requester.user_id;
      } else {
        return res.status(400).send("Invalid trainer client combination");
      }

      const existing = await Trainer_Assignment.findOne({
        where: {
          trainer_id: trainerId,
          client_id: clientId,
          status: { [Op.in]: ["pending", "accepted"] },
        },
      });
      if (existing) {
        return res.status(400).send("Request already exists");
      }
      const request = await Trainer_Assignment.create({
        trainer_id: trainerId,
        client_id: clientId,
        requested_by: requester.user_id,
        status: "pending",
      });
      return res.status(201).json(request);
    } catch (err) {
      return res.status(500).send("Error while sending request: " + err);
    }
  },
  respondToRequest: async (req, res) => {
    try {
      const requester = req.user; //userul care primeste requestul de train-client ->poate fi trainerul sau poate fi userul
      const { requestId } = req.params;
      const { action } = req.body;
      const request = await Trainer_Assignment.findByPk(requestId); //luam requestul din tabela
      if (!request) {
        return res.status(404).send("Request not found");
      }
      if (request.status !== "pending") {
        return res.status(400).send("Request already processed");
      }

      if (request.requested_by === requester.user_id) {
        return res.status(403).send("You cannot respond to your own request");
      }
      //nu poti accepta decat cererile care au treaba cu tine->fie ca client fie ca trainer
      if (
        requester.user_id !== request.trainer_id &&
        requester.user_id !== request.client_id
      ) {
        return res.status(403).send("Not allowed");
      }

      if (action === "accept") {
        const alreadyAccepted = await Trainer_Assignment.findOne({
          where: {
            client_id: request.client_id,
            status: "accepted",
            // id: { [Op.ne]: request.id },
          },
        });

        if (alreadyAccepted) {
          return res.status(400).send("Client already has an active trainer");
        }

        request.status = "accepted";
      } else if (action === "reject") {
        request.status = "rejected";
      } else {
        return res.status(400).send("Invalid action");
      }

      await request.save();

      return res.status(200).send(`Request ${action}ed`);
    } catch (err) {
      return res.status(500).send("Error while processing request: " + err);
    }
  },
  getTrainersByGym: async (req, res) => {
    try {
      const { gymId } = req.params;
      const trainers = await User.findAll({
        where: {
          gym_id: gymId,
          role: "trainer",
          is_active: true,
        },
        attributes: ["user_id", "first_name", "last_name", "email"],
      });
      return res.status(200).json(trainers);
    } catch (err) {
      return res.status(500).send("Error while fetching trainers: " + err);
    }
  },
  getClientsByGym: async (req, res) => {
    try {
      const { gymId } = req.params;
      const clients = await User.findAll({
        where: {
          gym_id: gymId,
          role: "client",
          is_active: true,
        },
        attributes: ["user_id", "first_name", "last_name", "email"],
      });
      return res.status(200).json(clients);
    } catch (err) {
      return res.status(500).send("Error while fetching clients: " + err);
    }
  },
  getAcceptedClients: async (req, res) => {
    try {
      const user = req.user;
      const assignments = await Trainer_Assignment.findAll({
        where: {
          trainer_id: user.user_id,
          status: "accepted",
        },
        include: [
          {
            model: User,
            as: "Client",
            attributes: [
              "user_id",
              "first_name",
              "last_name",
              "phone",
              "email",
            ],
          },
        ],
      });
      return res.status(200).json(assignments);
    } catch (err) {
      return res.status(500).send("Error fetching accepted clients: " + err);
    }
  },
  getMyTrainer: async (req, res) => {
    try {
      const user = req.user;
      const assignment = await Trainer_Assignment.findOne({
        where: {
          client_id: user.user_id,
          status: "accepted",
        },
        include: [
          {
            model: User,
            as: "Trainer",
            attributes: [
              "user_id",
              "first_name",
              "last_name",
              "email",
              "phone",
            ],
          },
        ],
      });
      if (!assignment) {
        return res.status(404).send("No active trainer found");
      }
      return res.status(200).json(assignment.Trainer);
    } catch (err) {
      return res.status(500).send("Error while fetching trainer: " + err);
    }
  },
  endTraining: async (req, res) => {
    try {
      const user = req.user;
      const relationship = await Trainer_Assignment.findOne({
        where: {
          client_id: user.user_id,
          status: "accepted",
        },
      });
      if (!relationship) {
        return res.status(404).send("No active trainer relationship found");
      }
      relationship.status = "ended";
      await relationship.save();
      return res.status(200).send("Trainer relationship ended");
    } catch (err) {
      return res.status(500).send("Error" + err);
    }
  },
  endClientTraining: async (req, res) => {
    try {
      const trainer = req.user;
      const { clientId } = req.params;

      const relationship = await Trainer_Assignment.findOne({
        where: {
          trainer_id: trainer.user_id,
          client_id: clientId,
          status: "accepted",
        },
      });

      if (!relationship) {
        return res.status(404).send("No active relationship found");
      }

      relationship.status = "ended";
      await relationship.save();

      return res.status(200).send("Client relationship ended");
    } catch (err) {
      return res.status(500).send("Error: " + err.message);
    }
  },
};
