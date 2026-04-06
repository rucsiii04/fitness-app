import { body } from "express-validator";

export const createClassSessionValidation = [
  body("class_type_id")
    .notEmpty()
    .withMessage("class_type_id is required")
    .isInt()
    .withMessage("class_type_id must be an integer"),

  body("gym_id")
    .notEmpty()
    .withMessage("gym_id is required")
    .isInt()
    .withMessage("gym_id must be an integer"),

  body("start_datetime")
    .notEmpty()
    .withMessage("start_datetime is required")
    .isISO8601()
    .withMessage("start_datetime must be a valid ISO 8601 date"),

  body("end_datetime")
    .notEmpty()
    .withMessage("end_datetime is required")
    .isISO8601()
    .withMessage("end_datetime must be a valid ISO 8601 date")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_datetime)) {
        throw new Error("end_datetime must be after start_datetime");
      }
      return true;
    }),

  body("max_participants")
    .notEmpty()
    .withMessage("max_participants is required")
    .isInt({ min: 1 })
    .withMessage("max_participants must be a positive integer"),
];
