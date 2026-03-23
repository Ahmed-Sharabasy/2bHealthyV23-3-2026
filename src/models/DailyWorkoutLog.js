import mongoose from "mongoose";

const dailyWorkoutLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    workoutPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkoutPlan",
    },
    dayIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    exercises: [
      {
        externalId: {
          type: String,
        },
        name: {
          type: String,
          required: [true, "Exercise name is required"],
          trim: true,
        },
        sets: {
          type: Number,
          default: 0,
          min: 0,
        },
        reps: {
          type: Number,
          default: 0,
          min: 0,
        },
        restSec: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ─────────────────────────────────────────────────
dailyWorkoutLogSchema.index({ user: 1, createdAt: -1 });
dailyWorkoutLogSchema.index({ workoutPlan: 1, dayIndex: 1 });

const DailyWorkoutLog = mongoose.model(
  "DailyWorkoutLog",
  dailyWorkoutLogSchema,
);

export default DailyWorkoutLog;
