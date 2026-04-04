import { body } from "express-validator";

export const startSessionValidation = [
  body("workout_id")
    .notEmpty()
    .withMessage("workout_id is required")
    .isInt()
    .withMessage("workout_id must be an integer"),
];
