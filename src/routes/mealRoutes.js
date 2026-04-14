import { Router } from "express";
import {
  getAllMeals,
  getAllMealsNoPagination,
  getMealById,
  searchMeals,
  getMealsByCategory,
  getMealsByArea,
  filterMealsByNutrition,
  getMealIngredients,
} from "../controllers/mealController.js";

const router = Router();

// ── Specific routes (must come BEFORE /:id) ─────
router.get("/all", getAllMealsNoPagination);
router.get("/search", searchMeals);
router.get("/filter", filterMealsByNutrition);
router.get("/category/:category", getMealsByCategory);
router.get("/area/:area", getMealsByArea);

// ── Parameterized routes ────────────────────────
router.get("/:id/ingredients", getMealIngredients);
router.get("/:id", getMealById);

// ── Root route ──────────────────────────────────
router.get("/", getAllMeals);

export default router;
