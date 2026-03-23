import { Router } from "express";
import workoutController from "../controllers/workoutController.js";
import {
  generateWorkoutPlanValidator,
  logDailyWorkoutValidator,
  completeWorkoutValidator,
} from "../validators/workoutValidator.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

const router = Router();

// ── All routes are protected ────────────────────────────────
router.use(authMiddleware);

// Workout plans
router.post(
  "/plan",
  generateWorkoutPlanValidator,
  validateRequest,
  workoutController.generateWorkoutPlan,
);
router.get("/plan/active", workoutController.getWorkoutPlan);
router.get("/plan", workoutController.getAllWorkoutPlans);

// Daily workout logs
router.post(
  "/daily-log",
  logDailyWorkoutValidator,
  validateRequest,
  workoutController.logDailyWorkout,
);
router.get("/daily-log", workoutController.getDailyWorkoutLogs);
router.patch(
  "/daily-log/:id/complete",
  completeWorkoutValidator,
  validateRequest,
  workoutController.completeWorkout,
);

export default router;
