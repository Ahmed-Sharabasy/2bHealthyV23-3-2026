import { body } from "express-validator";
import { GOAL_TYPES } from "../config/constants.js";

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Normalize target_time string → days.
 * "1 months" → 30, "2 weeks" → 14, "10 days" → 10
 */
export const normalizeTargetTime = (targetTime) => {
  if (!targetTime) return 30;
  const match = targetTime.match(/(\d+)/);
  if (!match) return 30;
  const num = parseInt(match[1], 10);
  const lower = targetTime.toLowerCase();
  if (lower.includes("month")) return `${num * 30} day`;
  if (lower.includes("week")) return `${num * 7} day`;
  return `${num} day`;
};

// ═══════════════════════════════════════════════════════════
//  EXISTING WORKOUT VALIDATORS
// ═══════════════════════════════════════════════════════════

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
  normalizeTargetTime,
  generateWorkoutPlanValidator,
  logDailyWorkoutValidator,
  completeWorkoutValidator,
};
