import { body } from "express-validator";

export const startSessionValidation = [
  body("workout_id")
    .optional()
    .isInt()
    .withMessage("workout_id must be an integer"),
];

export const updateSessionValidation = [
  body("notes")
    .optional()
    .isString()
    .withMessage("notes must be a string")
    .trim(),
];

export const finishSessionValidation = [
  body("notes")
    .optional()
    .isString()
    .withMessage("notes must be a string")
    .trim(),
];

export const logSetValidation = [
  body("exercise_id")
    .notEmpty()
    .withMessage("exercise_id is required")
    .isInt()
    .withMessage("exercise_id must be an integer"),

  body("reps")
    .notEmpty()
    .withMessage("reps is required")
    .isInt({ min: 1 })
    .withMessage("reps must be a positive integer"),

  body("weight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("weight must be a non-negative number"),
];