import { body } from "express-validator";

export const registerValidation = [
  body("email")
    .notEmpty()
    .withMessage("Emailul este obligatoriu.")
    .isEmail()
    .withMessage("Format email invalid."),

  body("phone")
    .notEmpty()
    .withMessage("Numărul de telefon este obligatoriu.")
    .customSanitizer((value) => value.replace(/\D/g, ""))
    .matches(/^07\d{8}$/)
    .withMessage("Număr de telefon invalid. Folosește formatul 07xxxxxxxx."),

  body("password")
    .notEmpty()
    .withMessage("Parola este obligatorie.")
    .isStrongPassword({
      minLength: 8,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minLowercase: 1,
    })
    .withMessage("Parola nu este suficient de puternică."),

  body("first_name").notEmpty().withMessage("Prenumele este obligatoriu.").trim(),

  body("last_name").notEmpty().withMessage("Numele este obligatoriu.").trim(),
];

export const loginValidation = [
  body("email")
    .notEmpty()
    .withMessage("Emailul este obligatoriu.")
    .isEmail()
    .withMessage("Format email invalid."),

  body("password").notEmpty().withMessage("Parola este obligatorie."),
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

export const verifyOtpValidation = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),

  body("otp")
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("Code must be 6 digits")
    .isNumeric()
    .withMessage("Code must be numeric"),
];

export const resetPasswordOtpValidation = [
  body("userId").notEmpty().withMessage("User id is required"),

  body("otp")
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("Code must be 6 digits")
    .isNumeric()
    .withMessage("Code must be numeric"),

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
