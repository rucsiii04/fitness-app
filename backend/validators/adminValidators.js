import { body } from "express-validator";

export const createStaffValidation = [
  body("gym_id")
    .notEmpty()
    .withMessage("gym_id is required")
    .isInt()
    .withMessage("gym_id must be an integer"),

  body("email")
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("Invalid email format"),

  body("first_name")
    .notEmpty()
    .withMessage("first_name is required")
    .trim(),

  body("last_name")
    .notEmpty()
    .withMessage("last_name is required")
    .trim(),

  body("phone")
    .notEmpty()
    .withMessage("phone is required")
    .customSanitizer((value) => value.replace(/\D/g, ""))
    .matches(/^07\d{8}$/)
    .withMessage("Invalid phone number. Use format 07xxxxxxxx."),
];

export const updateStaffValidation = [
  body("first_name")
    .optional()
    .notEmpty()
    .withMessage("first_name cannot be empty")
    .trim(),

  body("last_name")
    .optional()
    .notEmpty()
    .withMessage("last_name cannot be empty")
    .trim(),

  body("phone")
    .optional()
    .customSanitizer((value) => value.replace(/\D/g, ""))
    .matches(/^07\d{8}$/)
    .withMessage("Invalid phone number. Use format 07xxxxxxxx."),

  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be a boolean"),
];

export const setAlertValidation = [
  body("message")
    .optional({ nullable: true })
    .isString()
    .withMessage("message must be a string")
    .isLength({ max: 500 })
    .withMessage("message cannot exceed 500 characters")
    .trim(),

  body("end_at")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("end_at must be a valid date (ISO 8601)"),
];
