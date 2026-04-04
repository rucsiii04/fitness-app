import { body } from "express-validator";

export const setWorkoutExercisesValidation = [
  body("exercises")
    .isArray({ min: 1 })
    .withMessage("Exercises must be a non-empty array"),

  body("exercises.*.exercise_id")
    .isInt()
    .withMessage("exercise_id must be an integer"),

  body("exercises.*.sets")
    .optional()
    .isInt()
    .withMessage("sets must be an integer"),

  body("exercises.*.reps")
    .optional()
    .isString()
    .withMessage("reps must be a string"),

  body("exercises.*.rest_time")
    .optional()
    .isInt()
    .withMessage("rest_time must be an integer"),

  body("exercises.*.notes")
    .optional()
    .isString()
    .withMessage("notes must be a string"),
];