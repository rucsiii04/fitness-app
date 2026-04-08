import { body } from "express-validator";

export const createGymValidation = [
  body("name").notEmpty().withMessage("Gym name is required").trim(),

  body("address").notEmpty().withMessage("Address is required").trim(),

  body("max_capacity")
    .notEmpty()
    .withMessage("Max capacity is required")
    .isInt({ min: 1 })
    .withMessage("Max capacity must be a positive integer"),

  body("opening_time")
    .notEmpty()
    .withMessage("Opening time is required")
    .matches(/^\d{2}:\d{2}(:\d{2})?$/)
    .withMessage("Opening time must be in HH:MM or HH:MM:SS format"),

  body("closing_time")
    .notEmpty()
    .withMessage("Closing time is required")
    .matches(/^\d{2}:\d{2}(:\d{2})?$/)
    .withMessage("Closing time must be in HH:MM or HH:MM:SS format"),

  body("latitude").optional().isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
  body("longitude").optional().isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
];

export const updateGymValidation = [
  body("name").optional().notEmpty().withMessage("Gym name cannot be empty").trim(),

  body("address").optional().notEmpty().withMessage("Address cannot be empty").trim(),

  body("max_capacity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Max capacity must be a positive integer"),

  body("opening_time")
    .optional()
    .matches(/^\d{2}:\d{2}(:\d{2})?$/)
    .withMessage("Opening time must be in HH:MM or HH:MM:SS format"),

  body("closing_time")
    .optional()
    .matches(/^\d{2}:\d{2}(:\d{2})?$/)
    .withMessage("Closing time must be in HH:MM or HH:MM:SS format"),

  body("latitude").optional().isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
  body("longitude").optional().isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
];
