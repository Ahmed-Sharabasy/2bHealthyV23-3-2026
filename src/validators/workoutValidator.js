import { body } from "express-validator";
import { GOAL_TYPES } from "../config/constants.js";

export const generateWorkoutPlanValidator = [
  body("goalType")
    .notEmpty()
    .withMessage("Goal type is required")
    .isIn(GOAL_TYPES)
    .withMessage(`Goal type must be one of: ${GOAL_TYPES.join(", ")}`),
  body("durationWeeks")
    .notEmpty()
    .withMessage("Duration in weeks is required")
    .isInt({ min: 1, max: 52 })
    .withMessage("Duration must be between 1 and 52 weeks"),
];

export const logDailyWorkoutValidator = [
  body("workoutPlanId")
    .optional()
    .isMongoId()
    .withMessage("Invalid workout plan ID"),
  body("dayIndex")
    .notEmpty()
    .withMessage("Day index is required")
    .isInt({ min: 0 })
    .withMessage("Day index must be a non-negative integer"),
  body("exercises")
    .isArray({ min: 1 })
    .withMessage("At least one exercise is required"),
  body("exercises.*.name")
    .trim()
    .notEmpty()
    .withMessage("Exercise name is required"),
  body("exercises.*.sets")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Sets must be a non-negative integer"),
  body("exercises.*.reps")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Reps must be a non-negative integer"),
  body("exercises.*.restSec")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Rest seconds must be a non-negative integer"),
  body("exercises.*.externalId").optional().trim(),
];

export const completeWorkoutValidator = [
  body("completed")
    .notEmpty()
    .withMessage("Completed status is required")
    .isBoolean()
    .withMessage("Completed must be a boolean"),
];

export default {
  generateWorkoutPlanValidator,
  logDailyWorkoutValidator,
  completeWorkoutValidator,
};
