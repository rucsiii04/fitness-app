import { body } from "express-validator";

export const updateTrainerProfileValidation = [
  body("specialization")
    .optional()
    .notEmpty()
    .withMessage("Specialization cannot be empty")
    .trim(),

  body("experience_years")
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage("Experience years must be an integer between 0 and 50"),

  body("bio")
    .optional()
    .isString()
    .withMessage("bio must be a string")
    .trim(),
];

export const sendTrainerRequestValidation = [
  body("targetUserId")
    .notEmpty()
    .withMessage("targetUserId is required")
    .isInt()
    .withMessage("targetUserId must be an integer"),
];

export const respondToTrainerRequestValidation = [
  body("action")
    .notEmpty()
    .withMessage("action is required")
    .isIn(["accept", "reject"])
    .withMessage("action must be 'accept' or 'reject'"),
];

export const createTrainerProfileValidation = [
  body("specialization")
    .notEmpty()
    .withMessage("Specialization is required")
    .trim(),

  body("experience_years")
    .notEmpty()
    .withMessage("Experience years is required")
    .isInt({ min: 0, max: 50 })
    .withMessage("Experience years must be an integer between 0 and 50"),

  body("bio").optional().isString().trim(),
];
