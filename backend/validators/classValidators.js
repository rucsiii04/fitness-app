import { body } from "express-validator";

const CLASS_DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"];

export const createClassTypeValidation = [
  body("name")
    .notEmpty()
    .withMessage("Numele tipului de clasă este obligatoriu.")
    .trim(),

  body("description")
    .optional()
    .isString()
    .withMessage("Descrierea trebuie să fie text.")
    .trim(),

  body("difficulty_level")
    .optional()
    .isIn(CLASS_DIFFICULTY_LEVELS)
    .withMessage("Dificultatea trebuie să fie: beginner, intermediate sau advanced."),

  body("max_participants")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Numărul maxim de participanți trebuie să fie un număr întreg pozitiv."),

  body("gym_id")
    .notEmpty()
    .withMessage("ID-ul sălii este obligatoriu.")
    .isInt()
    .withMessage("ID-ul sălii trebuie să fie un număr întreg."),
];

export const markAttendanceValidation = [
  body("status")
    .notEmpty()
    .withMessage("Statusul este obligatoriu.")
    .isIn(["attended", "no_show"])
    .withMessage("Statusul trebuie să fie 'attended' sau 'no_show'."),
];

export const createClassSessionValidation = [
  body("class_type_id")
    .notEmpty()
    .withMessage("Tipul clasei este obligatoriu.")
    .isInt()
    .withMessage("ID-ul tipului de clasă trebuie să fie un număr întreg."),

  body("gym_id")
    .notEmpty()
    .withMessage("ID-ul sălii este obligatoriu.")
    .isInt()
    .withMessage("ID-ul sălii trebuie să fie un număr întreg."),

  body("start_datetime")
    .notEmpty()
    .withMessage("Data și ora de start sunt obligatorii.")
    .isISO8601()
    .withMessage("Data de start trebuie să fie o dată validă."),

  body("end_datetime")
    .notEmpty()
    .withMessage("Data și ora de final sunt obligatorii.")
    .isISO8601()
    .withMessage("Data de final trebuie să fie o dată validă.")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_datetime)) {
        throw new Error("Ora de final trebuie să fie după ora de start.");
      }
      return true;
    }),

  body("max_participants")
    .notEmpty()
    .withMessage("Capacitatea maximă este obligatorie.")
    .isInt({ min: 1 })
    .withMessage("Capacitatea maximă trebuie să fie un număr întreg pozitiv."),
];
