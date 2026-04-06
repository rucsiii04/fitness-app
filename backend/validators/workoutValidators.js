import { body } from "express-validator";

const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"];
const SOURCES = ["trainer", "ai", "user"];

export const createWorkoutValidation = [
  body("name").notEmpty().withMessage("Workout name is required").trim(),

  body("description").optional().isString().trim(),

  body("difficulty_level")
    .optional()
    .isIn(DIFFICULTY_LEVELS)
    .withMessage(`difficulty_level must be one of: ${DIFFICULTY_LEVELS.join(", ")}`),

  body("source")
    .optional()
    .isIn(SOURCES)
    .withMessage(`source must be one of: ${SOURCES.join(", ")}`),
];

export const updateWorkoutValidation = [
  body("name").optional().notEmpty().withMessage("Workout name cannot be empty").trim(),

  body("description").optional().isString().trim(),

  body("difficulty_level")
    .optional()
    .isIn(DIFFICULTY_LEVELS)
    .withMessage(`difficulty_level must be one of: ${DIFFICULTY_LEVELS.join(", ")}`),

  body("source")
    .optional()
    .isIn(SOURCES)
    .withMessage(`source must be one of: ${SOURCES.join(", ")}`),
];

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