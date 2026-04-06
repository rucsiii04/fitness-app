import { body } from "express-validator";

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
