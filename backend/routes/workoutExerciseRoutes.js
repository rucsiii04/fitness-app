import express from "express";
import { controllers } from "../controllers/index.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { setWorkoutExercisesValidation } from "../validators/workoutValidators.js";
import { handleValidation } from "../validators/handleValidation.js";

export const router = express.Router();

router.get(
  "/:workoutId/exercises",
  verifyToken,
  controllers.workoutExerciseController.getByWorkout,
);

router.post(
  "/:workoutId/exercises",
  verifyToken,
  controllers.workoutExerciseController.addOne,
);

router.put(
  "/:workoutId/exercises",
  verifyToken,
  setWorkoutExercisesValidation,
  handleValidation,
  controllers.workoutExerciseController.replaceAll,
);

router.put(
  "/:workoutId/exercises/:id",
  verifyToken,
  controllers.workoutExerciseController.update,
);

router.delete(
  "/:workoutId/exercises/:id",
  verifyToken,
  controllers.workoutExerciseController.remove,
);


