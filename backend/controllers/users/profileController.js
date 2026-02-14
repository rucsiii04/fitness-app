import { Client_Profile, User } from "../../models/index.js";

export const controller = {
  createProfile: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const {
        current_weight,
        height,
        activity_level,
        main_goal,
        gender,
        medical_restriction,
      } = req.body;

      if (
        current_weight === undefined ||
        height === undefined ||
        activity_level === undefined ||
        main_goal === undefined
      ) {
        return res.status(400).send("All required fields must be provided");
      }
      if (
        isNaN(current_weight) ||
        current_weight <= 30 ||
        current_weight > 300
      ) {
        return res.status(400).send("Invalid weight value");
      }
      if (isNaN(height) || height < 100 || height > 250) {
        return res.status(400).send("Height must be between 100 and 250 cm");
      }
      const validActivity = [
        "sedentary",
        "light",
        "moderate",
        "active",
        "very_active",
      ];
      if (!validActivity.includes(activity_level)) {
        return res.status(400).send("Invalid activity level");
      }
      const validGoals = ["lose_weight", "maintain", "gain_weight"];
      if (!validGoals.includes(main_goal)) {
        return res.status(400).send("Invalid main goal");
      }
      if (gender !== "female" && gender !== "male") {
        return res.status(400).send("Invalid gender");
      }
      const existingProfile = await Client_Profile.findByPk(userId);
      if (existingProfile) {
        return res.status(400).send("Profile already exists");
      }
      const profile = await Client_Profile.create({
        user_id: userId,
        current_weight,
        height,
        activity_level,
        main_goal,
        gender,
        medical_restriction,
      });
      res.status(201).json(profile);
    } catch (err) {
      return res.status(500).send("Error while creating profile: " + err);
    }
  },
  getProfile: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const profile = await Client_Profile.findByPk(userId);
      if (!profile) {
        return res.status(404).send("Profile not found");
      }
      res.status(200).json(profile);
    } catch (err) {
      return res.status(500).json("Error while fetching profile: " + err);
    }
  },
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const profile = await Client_Profile.findByPk(userId);
      if (!profile) {
        return res.status(404).send("Profile not found");
      }
      const updates = {};
      const {
        current_weight,
        height,
        activity_level,
        main_goal,
        gender,
        medical_restriction,
      } = req.body;
      if (current_weight !== undefined) {
        if (
          isNaN(current_weight) ||
          current_weight <= 30 ||
          current_weight > 300
        ) {
          return res.status(400).send("Invalid weight value");
        }
        updates.current_weight = current_weight;
      }
      if (height !== undefined) {
        if (isNaN(height) || height < 100 || height > 250) {
          return res.status(400).send("Height must be between 100 and 250 cm");
        }
        updates.height = height;
      }
      if (activity_level !== undefined) {
        const validActivity = [
          "sedentary",
          "light",
          "moderate",
          "active",
          "very_active",
        ];
        if (!validActivity.includes(activity_level)) {
          return res.status(400).send("Invalid activity level");
        }
        updates.activity_level = activity_level;
      }
      if (main_goal !== undefined) {
        const validGoals = ["lose_weight", "maintain", "gain_weight"];
        if (!validGoals.includes(main_goal)) {
          return res.status(400).send("Invalid main goal");
        }
        updates.main_goal = main_goal;
      }
      if (medical_restriction !== undefined)
        updates.medical_restriction = medical_restriction;

      if (gender !== undefined) {
        if (gender !== "female" && gender !== "male") {
          return res.status(400).send("Invalid gender");
          updates.gender = gender;
        }
      }
      if (Object.keys(updates).length === 0) {
        return res.status(400).send("No valid fields provided");
      }
      await profile.update(updates);
      return res.status(200).json(profile);
    } catch (err) {
      return res.status(500).send("Error while updating profile: " + err);
    }
  },
};
