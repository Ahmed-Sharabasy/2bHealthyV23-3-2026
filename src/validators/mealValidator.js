import { body } from "express-validator";
import { MEAL_TYPES, MEAL_SOURCES, GOAL_TYPES } from "../config/constants.js";

export const createMealValidator = [
  body("name").trim().notEmpty().withMessage("Meal name is required"),
  body("calories")
    .notEmpty()
    .withMessage("Calories are required")
    .isFloat({ min: 0 })
    .withMessage("Calories must be a positive number"),
  body("protein")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Protein must be a positive number"),
  body("carbs")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Carbs must be a positive number"),
  body("fats")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Fats must be a positive number"),
  body("mealType")
    .notEmpty()
    .withMessage("Meal type is required")
    .isIn(MEAL_TYPES)
    .withMessage(`Meal type must be one of: ${MEAL_TYPES.join(", ")}`),
  body("source")
    .optional()
    .isIn(MEAL_SOURCES)
    .withMessage(`Source must be one of: ${MEAL_SOURCES.join(", ")}`),
];

export const generateMealPlanValidator = [
  body("goalType")
    .notEmpty()
    .withMessage("Goal type is required")
    .isIn(GOAL_TYPES)
    .withMessage(`Goal type must be one of: ${GOAL_TYPES.join(", ")}`),
  body("caloriesTarget")
    .notEmpty()
    .withMessage("Calories target is required")
    .isFloat({ min: 500, max: 10000 })
    .withMessage("Calories target must be between 500 and 10000"),
  body("proteinTarget")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Protein target must be a positive number"),
  body("carbsTarget")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Carbs target must be a positive number"),
  body("fatsTarget")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Fats target must be a positive number"),
  body("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Start date must be a valid date"),
  body("endDate")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("End date must be a valid date"),
];

export const logDailyMealValidator = [
  body("mealPlanId").optional().isMongoId().withMessage("Invalid meal plan ID"),
  body("dayIndex")
    .notEmpty()
    .withMessage("Day index is required")
    .isInt({ min: 0 })
    .withMessage("Day index must be a non-negative integer"),
  body("meals")
    .isArray({ min: 1 })
    .withMessage("At least one meal is required"),
  body("meals.*.meal")
    .notEmpty()
    .withMessage("Meal ID is required")
    .isMongoId()
    .withMessage("Invalid meal ID"),
  body("meals.*.mealType")
    .notEmpty()
    .withMessage("Meal type is required")
    .isIn(MEAL_TYPES)
    .withMessage(`Meal type must be one of: ${MEAL_TYPES.join(", ")}`),
  body("meals.*.portionSize")
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage("Portion size must be at least 0.1"),
];

export default {
  createMealValidator,
  generateMealPlanValidator,
  logDailyMealValidator,
};
