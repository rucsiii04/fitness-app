import { body } from "express-validator";

const ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "active", "very_active"];
const MAIN_GOALS = ["lose_weight", "maintain", "gain_weight"];
const GENDERS = ["male", "female"];

export const createProfileValidation = [
  body("current_weight")
    .notEmpty()
    .withMessage("current_weight is required")
    .isFloat({ min: 30, max: 300 })
    .withMessage("current_weight must be a number between 30 and 300"),

  body("height")
    .notEmpty()
    .withMessage("height is required")
    .isFloat({ min: 100, max: 250 })
    .withMessage("height must be between 100 and 250 cm"),

  body("activity_level")
    .notEmpty()
    .withMessage("activity_level is required")
    .isIn(ACTIVITY_LEVELS)
    .withMessage(`activity_level must be one of: ${ACTIVITY_LEVELS.join(", ")}`),

  body("main_goal")
    .notEmpty()
    .withMessage("main_goal is required")
    .isIn(MAIN_GOALS)
    .withMessage(`main_goal must be one of: ${MAIN_GOALS.join(", ")}`),

  body("gender")
    .notEmpty()
    .withMessage("gender is required")
    .isIn(GENDERS)
    .withMessage(`gender must be one of: ${GENDERS.join(", ")}`),

  body("medical_restriction")
    .optional()
    .isString()
    .withMessage("medical_restriction must be a string")
    .trim(),
];

export const updateProfileValidation = [
  body("current_weight")
    .optional()
    .isFloat({ min: 30, max: 300 })
    .withMessage("current_weight must be a number between 30 and 300"),

  body("height")
    .optional()
    .isFloat({ min: 100, max: 250 })
    .withMessage("height must be between 100 and 250 cm"),

  body("activity_level")
    .optional()
    .isIn(ACTIVITY_LEVELS)
    .withMessage(`activity_level must be one of: ${ACTIVITY_LEVELS.join(", ")}`),

  body("main_goal")
    .optional()
    .isIn(MAIN_GOALS)
    .withMessage(`main_goal must be one of: ${MAIN_GOALS.join(", ")}`),

  body("gender")
    .optional()
    .isIn(GENDERS)
    .withMessage(`gender must be one of: ${GENDERS.join(", ")}`),

  body("medical_restriction")
    .optional()
    .isString()
    .withMessage("medical_restriction must be a string")
    .trim(),
];
