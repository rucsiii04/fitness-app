import { body } from "express-validator";

const MUSCLE_GROUPS = ["chest", "back", "legs", "shoulders", "arms", "core", "full-body"];

export const createExerciseValidation = [
  body("name").notEmpty().withMessage("Exercise name is required").trim(),

  body("muscle_group")
    .notEmpty()
    .withMessage("Muscle group is required")
    .isIn(MUSCLE_GROUPS)
    .withMessage(`Muscle group must be one of: ${MUSCLE_GROUPS.join(", ")}`),

  body("equipment_required").optional().isString().trim(),

  body("description").optional().isString().trim(),
];

export const updateExerciseValidation = [
  body("name").optional().notEmpty().withMessage("Exercise name cannot be empty").trim(),

  body("muscle_group")
    .optional()
    .isIn(MUSCLE_GROUPS)
    .withMessage(`Muscle group must be one of: ${MUSCLE_GROUPS.join(", ")}`),

  body("equipment_required").optional().isString().trim(),

  body("description").optional().isString().trim(),
];
