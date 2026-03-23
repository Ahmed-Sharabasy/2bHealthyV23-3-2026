import { Router } from "express";
import * as foodController from "../controllers/foodController.js";

const router = Router();

router.route("/fetchFood").get(foodController.fetchFood);
router
  .route("/getFoodNutritionWithImage")
  .get(foodController.getFoodNutritionWithImage);
// router.route("/recipes/:id").get(foodController.getFullRecipe);
router.route("/nutrition/:foodName").get(foodController.getFoodNutrition);
router.route("/search").get(foodController.searchRecipesByIngredients);

// test route
router.route("/searchIngredient").get(foodController.searchIngredient);

router.route("/generateRandomMealPlan").get(foodController.generateRandomMealPlan);

export default router;
