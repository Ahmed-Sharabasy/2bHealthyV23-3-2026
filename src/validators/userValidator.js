import { body } from "express-validator";
import { ACTIVITY_LEVELS, GOAL_TYPES } from "../config/constants.js";

export const updateProfileValidator = [
  body("heightCm")
    .optional()
    .isFloat({ min: 50, max: 300 })
    .withMessage("Height must be between 50 and 300 cm"),
  body("weightKg")
    .optional()
    .isFloat({ min: 20, max: 500 })
    .withMessage("Weight must be between 20 and 500 kg"),
  body("bodyFat")
    .optional()
    .isFloat({ min: 1, max: 70 })
    .withMessage("Body fat must be between 1% and 70%"),
  body("activityLevel")
    .optional()
    .isIn(ACTIVITY_LEVELS)
    .withMessage(
      `Activity level must be one of: ${ACTIVITY_LEVELS.join(", ")}`,
    ),
  body("goalType")
    .optional()
    .isIn(GOAL_TYPES)
    .withMessage(`Goal type must be one of: ${GOAL_TYPES.join(", ")}`),
  body("targetWeight")
    .optional()
    .isFloat({ min: 20, max: 500 })
    .withMessage("Target weight must be between 20 and 500 kg"),
];

export const logProgressValidator = [
  body("metricType")
    .notEmpty()
    .withMessage("Metric type is required")
    .isIn(["weight", "body_fat"])
    .withMessage("Metric type must be weight or body_fat"),
  body("value")
    .notEmpty()
    .withMessage("Value is required")
    .isFloat({ min: 0 })
    .withMessage("Value must be a positive number"),
  body("unit").optional().trim(),
  body("recordedAt")
    .optional()
    .isISO8601()
    .withMessage("Recorded date must be a valid ISO date"),
];

export default {
  updateProfileValidator,
  logProgressValidator,
};
