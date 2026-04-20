// ── AI Routes ───────────────────────────────────────────────
import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  validateWorkoutPlan,
  validateMealPlan,
} from "../validators/aiValidator.js";
import { getWorkoutPlan } from "../controllers/aiWorkoutController.js";
import { getMealPlan } from "../controllers/aiMealController.js";

const router = Router();

// POST /api/v1/ai/workout-plan
router.post(
  "/workout-plan",
  authMiddleware,
  validateWorkoutPlan,
  validateRequest,
  getWorkoutPlan,
);

// POST /api/v1/ai/meal-plan
router.post(
  "/meal-plan",
  authMiddleware,
  validateMealPlan,
  validateRequest,
  getMealPlan,
);

export default router;
