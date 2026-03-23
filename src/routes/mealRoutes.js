import { Router } from "express";
import mealController from "../controllers/mealController.js";
import {
  createMealValidator,
  generateMealPlanValidator,
  logDailyMealValidator,
} from "../validators/mealValidator.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

const router = Router();

// ── All routes are protected ────────────────────────────────
router.use(authMiddleware);

// Meals CRUD
router.post(
  "/",
  createMealValidator,
  validateRequest,
  mealController.createMeal,
);
router.get("/", mealController.getMeals);
router.get("/:id", mealController.getMealById);

// Meal plans
router.post(
  "/plan",
  generateMealPlanValidator,
  validateRequest,
  mealController.generateMealPlan,
);
router.get("/plan/active", mealController.getMealPlan);

// Daily meal logs
router.post(
  "/daily-log",
  logDailyMealValidator,
  validateRequest,
  mealController.logDailyMeal,
);
router.get("/daily-log", mealController.getDailyMealLogs);

export default router;
