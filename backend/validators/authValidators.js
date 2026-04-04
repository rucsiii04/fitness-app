import { body } from "express-validator";

export const registerValidation = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),

  body("phone")
    .notEmpty()
    .withMessage("Phone is required")
    .customSanitizer((value) => value.replace(/\D/g, ""))
    .matches(/^07\d{8}$/)
    .withMessage("Invalid Romanian phone number"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isStrongPassword({
      minLength: 8,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minLowercase: 1,
    })
    .withMessage("Password not strong enough"),

  body("first_name").notEmpty().withMessage("First name is required").trim(),

  body("last_name").notEmpty().withMessage("Last name is required").trim(),
];

export const loginValidation = [
  body("email")
    .notEmpty()
    .withMessage("Email required")
    .isEmail()
    .withMessage("Invalid email"),

  body("password").notEmpty().withMessage("Password required"),
];

export const requestResetValidation = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
];

export const resetPasswordValidation = [
  body("userId").notEmpty().withMessage("User id is required"),

  body("token").notEmpty().withMessage("Token is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isStrongPassword({
      minLength: 8,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minLowercase: 1,
    })
    .withMessage("Password not strong enough"),
];

export const updatePasswordValidation = [
  body("oldPassword").notEmpty().withMessage("Old password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isStrongPassword({
      minLength: 8,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minLowercase: 1,
    })
    .withMessage("Password must be strong")
    .custom((value, { req }) => {
      if (value === req.body.oldPassword) {
        throw new Error("New password must be different from old password");
      }
      return true;
    }),
];
