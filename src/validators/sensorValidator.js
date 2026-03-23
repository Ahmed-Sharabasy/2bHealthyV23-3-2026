import { body } from "express-validator";
import { SENSOR_TYPES } from "../config/constants.js";

export const submitReadingValidator = [
  body("deviceId")
    .notEmpty()
    .withMessage("Device ID is required")
    .isMongoId()
    .withMessage("Invalid device ID"),
  body("type")
    .notEmpty()
    .withMessage("Sensor type is required")
    .isIn(SENSOR_TYPES)
    .withMessage(`Sensor type must be one of: ${SENSOR_TYPES.join(", ")}`),
  body("value")
    .notEmpty()
    .withMessage("Sensor value is required")
    .isFloat()
    .withMessage("Value must be a number"),
  body("recordedAt")
    .optional()
    .isISO8601()
    .withMessage("Recorded date must be a valid ISO date"),
];

export const syncDeviceValidator = [
  body("deviceUUID").trim().notEmpty().withMessage("Device UUID is required"),
  body("readings")
    .isArray({ min: 1 })
    .withMessage("At least one reading is required"),
  body("readings.*.type")
    .notEmpty()
    .withMessage("Sensor type is required")
    .isIn(SENSOR_TYPES)
    .withMessage(`Sensor type must be one of: ${SENSOR_TYPES.join(", ")}`),
  body("readings.*.value")
    .notEmpty()
    .withMessage("Sensor value is required")
    .isFloat()
    .withMessage("Value must be a number"),
  body("readings.*.recordedAt")
    .optional()
    .isISO8601()
    .withMessage("Recorded date must be a valid ISO date"),
];

export default {
  submitReadingValidator,
  syncDeviceValidator,
};
