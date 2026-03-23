import mongoose from "mongoose";
import { SENSOR_TYPES, SENSOR_READING_TTL_DAYS } from "../config/constants.js";

const sensorReadingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Device",
    required: true,
  },
  type: {
    type: String,
    enum: SENSOR_TYPES,
    required: [true, "Sensor type is required"],
  },
  value: {
    type: Number,
    required: [true, "Sensor value is required"],
  },
  recordedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

// ── Indexes ─────────────────────────────────────────────────
sensorReadingSchema.index({ user: 1, type: 1, recordedAt: -1 });

// ── TTL index — auto-delete after configured days ───────────
sensorReadingSchema.index(
  { recordedAt: 1 },
  { expireAfterSeconds: SENSOR_READING_TTL_DAYS * 24 * 60 * 60 },
);

const SensorReading = mongoose.model("SensorReading", sensorReadingSchema);

export default SensorReading;
