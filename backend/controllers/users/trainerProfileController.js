import cloudinary from "../../config/cloudinary.js";
import { Trainer_Profile } from "../../models/index.js";

export const controller = {
  createTrainerProfile: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { specialization, experience_years, bio } = req.body;
      if (!specialization || !experience_years) {
        return res
          .status(400)
          .send("Specialization and experience years are required");
      }
      if (
        isNaN(experience_years) ||
        experience_years < 0 ||
        experience_years > 50
      ) {
        return res
          .status(400)
          .send(
            "Invalid experience years value. Value must be between 1 and 40",
          ); //dc are 60 de ani si a inceput f devreme? idk
      }
      const existingProfile = await Trainer_Profile.findByPk(userId);
      if (existingProfile) {
        return res.status(400).send("Profile already exists");
      }
      let imagePublicId = null;

      if (req.file) {
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "trainers/uploads" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          );

          stream.end(req.file.buffer);
        });

        imagePublicId = uploadResult.public_id;
      }
      const profile = await Trainer_Profile.create({
        user_id: userId,
        specialization,
        experience_years,
        bio,
        image_public_id: imagePublicId,
      });
      const imageUrl = imagePublicId
        ? cloudinary.url(imagePublicId)
        : cloudinary.url("default_avatar");
      return res.status(201).json({
        ...profile.toJSON(),
        image_url: imageUrl,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error creating trainer profile",
      });
    }
  },
  updateTrainerProfile: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const profile = await Trainer_Profile.findByPk(userId);
      if (!profile) {
        return res.status(404).send("Profile not found");
      }
      const { specialization, experience_years, bio } = req.body;
      const updates = {};
      if (specialization !== undefined) {
        updates.specialization = specialization;
      }
      if (experience_years !== undefined) {
        if (
          isNaN(experience_years) ||
          experience_years < 0 ||
          experience_years > 50
        ) {
          return res
            .status(400)
            .send(
              "Invalid experience years value. Value must be between 1 and 40",
            );
        }
        updates.experience_years = experience_years;
      }
      if (bio !== undefined) {
        updates.bio = bio;
      }
      if (req.file) {
        if (profile.image_public_id) {
          await cloudinary.uploader.destroy(profile.image_public_id);
        }

        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "trainers/uploads" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          );

          stream.end(req.file.buffer);
        });

        updates.image_public_id = uploadResult.public_id;
      }
      await profile.update(updates);

      const imageUrl = profile.image_public_id
        ? cloudinary.url(profile.image_public_id)
        : cloudinary.url("default_avatar");

      return res.status(200).json({
        ...profile.toJSON(),
        image_url: imageUrl,
      });
    } catch (err) {
      return res.status(500).json({
        message: "Error updating trainer profile",
      });
    }
  },
  getTrainerProfile: async (req, res) => {
    try {
      const userId = req.user.user_id;

      const profile = await Trainer_Profile.findByPk(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      const imageUrl = profile.image_public_id
        ? cloudinary.url(profile.image_public_id)
        : cloudinary.url("default_avatar");

      return res.status(200).json({
        ...profile.toJSON(),
        image_url: imageUrl,
      });
    } catch (err) {
      return res.status(500).send("Error while fetching trainer profile");
    }
  },

  deleteTrainerProfile: async (req, res) => {
    try {
      const userId = req.user.user_id;

      const profile = await Trainer_Profile.findByPk(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      if (profile.image_public_id) {
        await cloudinary.uploader.destroy(profile.image_public_id);
      }

      await profile.destroy();
      return res.status(200).json({ message: "Profile deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Error deleting trainer profile" });
    }
  },
};
