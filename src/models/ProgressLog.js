import mongoose from "mongoose";
import { METRIC_TYPES } from "../config/constants.js";

const progressLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    metricType: {
      type: String,
      enum: METRIC_TYPES,
      required: [true, "Metric type is required"],
    },
    value: {
      type: Number,
      required: [true, "Value is required"],
    },
    unit: {
      type: String,
      default: "kg",
      trim: true,
    },
    recordedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ─────────────────────────────────────────────────
progressLogSchema.index({ user: 1, metricType: 1, recordedAt: -1 });

const ProgressLog = mongoose.model("ProgressLog", progressLogSchema);

export default ProgressLog;
