import { controller as authController } from "./users/authController.js";
import { controller as profileController } from "./users/profileController.js";
import { controller as userController } from "./users/UserController.js";
import { controller as adminController } from "./admin/adminController.js";
import { controller as globalAdminController } from "./admin/globalAdminController.js";
import { controller as trainerProfileController } from "./users/trainerProfileController.js";
export const controllers = {
  authController,
  profileController,
  userController,
  adminController,
  globalAdminController,
  trainerProfileController,
};
