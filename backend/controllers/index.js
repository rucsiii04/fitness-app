import { controller as authController } from "./users/authController.js";
import { controller as profileController } from "./users/profileController.js";
import { controller as userController } from "./users/UserController.js";
import { controller as adminController } from "./admin/adminController.js";
import { controller as globalAdminController } from "./admin/globalAdminController.js";
import { controller as trainerProfileController } from "./users/trainerProfileController.js";
import { controller as membershipController } from "./membership/membershipController.js";
import { controller as classController } from "./gym/ClassController.js";
import { controller as exerciseController } from "./workouts/ExerciseController.js";
import { controller as workoutController } from "./workouts/WorkoutController.js";
import { controller as workoutExerciseController } from "./workouts/WorkoutExerciseController.js";
import { controller as workoutSessionController } from "./workouts/WorkoutSessionController.js";
import {controller as qrController} from "./gym/QRController.js"
import {controller as aiController}from "./ai/AIController.js"
import { controller as gymController } from "./gym/GymController.js";
import { controller as exportController } from "./admin/exportController.js";
export const controllers = {
  authController,
  profileController,
  userController,
  adminController,
  globalAdminController,
  trainerProfileController,
  membershipController,
  classController,
  exerciseController,
  workoutController,
  workoutExerciseController,
  workoutSessionController,
  qrController,
  aiController,
  gymController,
  exportController,
};

