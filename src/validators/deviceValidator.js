import { body } from "express-validator";

export const registerDeviceValidator = [
  body("deviceUUID").trim().notEmpty().withMessage("Device UUID is required"),
  body("model")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Model name cannot exceed 100 characters"),
  body("firmware")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Firmware version cannot exceed 50 characters"),
];

export const updateDeviceValidator = [
  body("model")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Model name cannot exceed 100 characters"),
  body("firmware")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Firmware version cannot exceed 50 characters"),
  body("isConnected")
    .optional()
    .isBoolean()
    .withMessage("isConnected must be a boolean"),
];

export default {
  registerDeviceValidator,
  updateDeviceValidator,
};
