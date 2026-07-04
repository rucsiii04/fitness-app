import { body } from "express-validator";

const PAYMENT_METHODS = ["cash", "card", "transfer"];

export const createMembershipTypeValidation = [
  body("gym_id")
    .notEmpty()
    .withMessage("gym_id is required")
    .isInt()
    .withMessage("gym_id must be an integer"),

  body("name")
    .notEmpty()
    .withMessage("name is required")
    .trim(),

  body("description")
    .optional()
    .isString()
    .withMessage("description must be a string")
    .trim(),

  body("duration_days")
    .notEmpty()
    .withMessage("duration_days is required")
    .isInt({ min: 1 })
    .withMessage("duration_days must be a positive integer"),

  body("price")
    .notEmpty()
    .withMessage("price is required")
    .isFloat({ min: 0 })
    .withMessage("price must be a non-negative number"),

  body("includes_group_classes")
    .optional()
    .isBoolean()
    .withMessage("includes_group_classes must be a boolean"),

  body("freeze_days")
    .optional()
    .isInt({ min: 0 })
    .withMessage("freeze_days must be a non-negative integer"),

  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be a boolean"),
];

export const updateMembershipTypeValidation = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("name cannot be empty")
    .trim(),

  body("description")
    .optional()
    .isString()
    .withMessage("description must be a string")
    .trim(),

  body("duration_days")
    .optional()
    .isInt({ min: 1 })
    .withMessage("duration_days must be a positive integer"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("price must be a non-negative number"),

  body("includes_group_classes")
    .optional()
    .isBoolean()
    .withMessage("includes_group_classes must be a boolean"),

  body("freeze_days")
    .optional()
    .isInt({ min: 0 })
    .withMessage("freeze_days must be a non-negative integer"),

  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be a boolean"),
];

export const issueMembershipValidation = [
  body("client_id")
    .notEmpty()
    .withMessage("client_id is required")
    .isInt()
    .withMessage("client_id must be an integer"),

  body("membership_type_id")
    .notEmpty()
    .withMessage("membership_type_id is required")
    .isInt()
    .withMessage("membership_type_id must be an integer"),

  body("payment_method")
    .notEmpty()
    .withMessage("payment_method is required")
    .isIn(PAYMENT_METHODS)
    .withMessage(`payment_method must be one of: ${PAYMENT_METHODS.join(", ")}`),

  body("start_date")
    .optional()
    .isISO8601()
    .withMessage("start_date must be a valid date (ISO 8601)"),
];

export const pauseMembershipValidation = [
  body("pause_days")
    .notEmpty()
    .withMessage("pause_days is required")
    .isInt({ min: 1 })
    .withMessage("pause_days must be a positive integer"),
];

export const pauseGymMembershipsValidation = [
  body("pause_days")
    .notEmpty()
    .withMessage("pause_days is required")
    .isInt({ min: 1 })
    .withMessage("pause_days must be a positive integer"),

  body("reason")
    .notEmpty()
    .withMessage("reason is required")
    .isString()
    .withMessage("reason must be a string")
    .trim(),
];
