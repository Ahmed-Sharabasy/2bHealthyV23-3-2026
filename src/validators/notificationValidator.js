import { body } from "express-validator";
import { NOTIFICATION_TYPES } from "../config/constants.js";

export const sendNotificationValidator = [
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid user ID"),
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),
  body("message").trim().notEmpty().withMessage("Message is required"),
  body("type")
    .notEmpty()
    .withMessage("Notification type is required")
    .isIn(NOTIFICATION_TYPES)
    .withMessage(`Type must be one of: ${NOTIFICATION_TYPES.join(", ")}`),
];

export default {
  sendNotificationValidator,
};
