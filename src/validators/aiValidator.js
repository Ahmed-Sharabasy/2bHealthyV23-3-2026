// ── AI Request Validators ───────────────────────────────────
import { body } from "express-validator";

/**
 * Validation rules for POST /api/v1/ai/workout-plan
 */
export const validateWorkoutPlan = [
  body("fitness_goal")
    .trim()
    .notEmpty()
    .withMessage("fitness_goal is required")
    .isIn(["fat_loss", "muscle_gain", "weight_gain", "weight_loss", "maintenance"])
    .withMessage(
      "fitness_goal must be one of: fat_loss, muscle_gain, weight_gain, weight_loss, maintenance"
    ),

  body("target_weight")
    .notEmpty()
    .withMessage("target_weight is required")
    .isFloat({ min: 20, max: 500 })
    .withMessage("target_weight must be a number between 20 and 500")
    .toFloat(),

  body("target_time")
    .trim()
    .notEmpty()
    .withMessage('target_time is required (e.g. "1 month", "3 months")'),

  body("workout_days")
    .isArray({ min: 1, max: 7 })
    .withMessage("workout_days must be an array of 1–7 days"),

  body("workout_days.*")
    .trim()
    .notEmpty()
    .withMessage("Each workout day must be a non-empty string"),

  body("injuries")
    .optional()
    .isArray()
    .withMessage("injuries must be an array"),

  body("injuries.*")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Each injury must be a non-empty string"),
];

/**
 * Validation rules for POST /api/v1/ai/meal-plan
 */
export const validateMealPlan = [
  body("fitness_goal")
    .trim()
    .notEmpty()
    .withMessage("fitness_goal is required")
    .isIn(["fat_loss", "weight_gain"])
    .withMessage("fitness_goal must be one of: fat_loss, weight_gain"),

  body("target_weight")
    .notEmpty()
    .withMessage("target_weight is required")
    .isFloat({ min: 20, max: 500 })
    .withMessage("target_weight must be a number between 20 and 500")
    .toFloat(),

  body("target_time")
    .trim()
    .notEmpty()
    .withMessage('target_time is required (e.g. "1 month", "2 weeks")'),

  body("excluded_foods")
    .optional()
    .isArray()
    .withMessage("excluded_foods must be an array"),

  body("excluded_foods.*")
    .optional()
    .trim()
    .notEmpty()
    .isIn([
      "Chicken", "Beef", "Lamb", "Pork", "Goat",
      "Pasta", "Seafood", "Vegetarian", "Vegan",
      "Miscellaneous", "Side",
    ])
    .withMessage(
      "Each excluded food must be a valid category: Chicken, Beef, Lamb, Pork, Goat, Pasta, Seafood, Vegetarian, Vegan, Miscellaneous, Side"
    ),
];

export default { validateWorkoutPlan, validateMealPlan };
