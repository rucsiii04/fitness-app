import { controller as authController } from "./users/authController.js";
import { controller as profileController } from "./users/profileController.js";
import { controller as userController } from "./users/UserController.js";
import { controller as adminController } from "./admin/adminController.js";
import { controller as globalAdminController } from "./admin/globalAdminController.js";
import { controller as trainerProfileController } from "./users/trainerProfileController.js";
import { controller as membershipController } from "./membership/membershipController.js";
import { controller as classController } from "./gym/ClassController.js";
import {controller as exerciseController} from "./workouts/ExerciseController.js"
export const controllers = {
  authController,
  profileController,
  userController,
  adminController,
  globalAdminController,
  trainerProfileController,
  membershipController,
  classController,
  exerciseController
};
