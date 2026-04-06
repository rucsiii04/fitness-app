import { body } from "express-validator";

export const startSessionValidation = [
  body("workout_id")
    .optional()
    .isInt()
    .withMessage("workout_id must be an integer"),
];