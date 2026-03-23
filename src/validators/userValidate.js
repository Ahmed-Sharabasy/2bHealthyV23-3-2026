import { body } from "express-validator";
import { ACTIVITY_LEVELS, GOAL_TYPES } from "../config/constants.js";

export class UserValidator {
  // validate update profile
  validateUpdateProfile() {
    return [
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
  }

  // validate log progress
}
