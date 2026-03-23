import { validationResult } from "express-validator";
import WorkoutPlan from "../models/WorkoutPlan.js";
import DailyWorkoutLog from "../models/DailyWorkoutLog.js";
import AppError from "../utils/AppError.js";

// ═════════════════════════════════════════════════════════════
// GENERATE WORKOUT PLAN
// ═════════════════════════════════════════════════════════════
const generateWorkoutPlan = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { goalType, durationWeeks } = req.body;

    // Deactivate existing active workout plans
    await WorkoutPlan.updateMany(
      { user: req.user._id, isActive: true },
      { isActive: false },
    );

    // Create new workout plan
    const workoutPlan = await WorkoutPlan.create({
      user: req.user._id,
      goalType,
      durationWeeks,
      isActive: true,
    });

    // ── External API Backup Strategy ──────────────────────
    // TODO: Integrate external exercise API here:
    // 1) Fetch exercises from external API based on goalType
    // 2) Normalize into exercise sub-documents
    // 3) Create DailyWorkoutLog entries with exercises
    // For now, return the plan shell

    res.status(201).json({
      status: "success",
      data: { workoutPlan },
      message:
        "Workout plan created. Populate daily logs via POST /workouts/daily-log.",
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════
// GET ACTIVE WORKOUT PLAN
// ═════════════════════════════════════════════════════════════
const getWorkoutPlan = async (req, res, next) => {
  try {
    const workoutPlan = await WorkoutPlan.findOne({
      user: req.user._id,
      isActive: true,
    });

    if (!workoutPlan) {
      return next(new AppError("No active workout plan found", 404));
    }

    res.status(200).json({
      status: "success",
      data: { workoutPlan },
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════
// GET ALL WORKOUT PLANS
// ═════════════════════════════════════════════════════════════
const getAllWorkoutPlans = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [workoutPlans, total] = await Promise.all([
      WorkoutPlan.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      WorkoutPlan.countDocuments({ user: req.user._id }),
    ]);

    res.status(200).json({
      status: "success",
      results: workoutPlans.length,
      total,
      page: parseInt(page),
      data: { workoutPlans },
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════
// LOG DAILY WORKOUT
// ═════════════════════════════════════════════════════════════
const logDailyWorkout = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { workoutPlanId, dayIndex, exercises } = req.body;

    const dailyWorkoutLog = await DailyWorkoutLog.create({
      user: req.user._id,
      workoutPlan: workoutPlanId || undefined,
      dayIndex,
      exercises,
      completed: false,
    });

    res.status(201).json({
      status: "success",
      data: { dailyWorkoutLog },
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════
// GET DAILY WORKOUT LOGS
// ═════════════════════════════════════════════════════════════
const getDailyWorkoutLogs = async (req, res, next) => {
  try {
    const {
      workoutPlanId,
      completed,
      startDate,
      endDate,
      limit = 30,
      page = 1,
    } = req.query;

    const filter = { user: req.user._id };
    if (workoutPlanId) filter.workoutPlan = workoutPlanId;
    if (completed !== undefined) filter.completed = completed === "true";
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [dailyWorkoutLogs, total] = await Promise.all([
      DailyWorkoutLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      DailyWorkoutLog.countDocuments(filter),
    ]);

    res.status(200).json({
      status: "success",
      results: dailyWorkoutLogs.length,
      total,
      page: parseInt(page),
      data: { dailyWorkoutLogs },
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════
// COMPLETE WORKOUT
// ═════════════════════════════════════════════════════════════
const completeWorkout = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { completed } = req.body;

    const dailyWorkoutLog = await DailyWorkoutLog.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { completed },
      { new: true, runValidators: true },
    );

    if (!dailyWorkoutLog) {
      return next(new AppError("Workout log not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: { dailyWorkoutLog },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  generateWorkoutPlan,
  getWorkoutPlan,
  getAllWorkoutPlans,
  logDailyWorkout,
  getDailyWorkoutLogs,
  completeWorkout,
};
