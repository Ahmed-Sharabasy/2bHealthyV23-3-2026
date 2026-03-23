import { validationResult } from "express-validator";
import MealPlan from "../models/MealPlan.js";
import WorkoutPlan from "../models/WorkoutPlan.js";
import ProgressLog from "../models/ProgressLog.js";
import AppError from "../utils/AppError.js";
import User from "../models/User.js";

// ═════════════════════════════════════════════════════════════
// GET PROFILE - old version (kept for reference, will remove later)
// ═════════════════════════════════════════════════════════════
// const getProfileOldOne = async (req, res, next) => {
//   try {
//     let profile = await User.findOne({ user: req.user._id }).populate(
//       "user",
//       "name email phoneNumber gender dateOfBirth language isEmailVerified",
//     );

//     if (!profile) {
//       // Auto-create profile if not exists
//       profile = await User.create({ user: req.user._id });
//       profile = await User.findById(profile._id).populate(
//         "user",
//         "name email phoneNumber gender dateOfBirth language isEmailVerified",
//       );
//     }

//     res.status(200).json({
//       status: "success",
//       data: { profile },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// ═════════════════════════════════════════════════════════════
//todo // 6/3/2026 upload avatar
// ═════════════════════════════════════════════════════════════

// update user profile
// only work with authenticated user, so we can get user id from req.user._id
export const uploadUserAvatar = async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: req.file.filename },
    { new: true, runValidators: true },
  );

  const data = req.file; // Multer adds the file info to req.file
  // Exclude buffer from response
  const { buffer, ...responseDataWuthoutBuffer } = data;

  res.status(200).json({
    updatedUser,
    responseDataWuthoutBuffer,
    status: "success",
    message: "User profile updated successfully",
  });
};

// ═════════════════════════════════════════════════════════════
//todo // 3/3/2026 GET PROFILE
// ═════════════════════════════════════════════════════════════

export const getProfile = async (req, res, next) => {
  const profile = await User.findById(req.user._id).select(`
      name
      email
      phoneNumber
      gender
      dateOfBirth
      language
      isActive
      isEmailVerified
      heightCm
      weightKg
      bodyFat
      activityLevel
      goalType
      targetWeight
    `);

  if (!profile) {
    return next(
      new AppError("Profile not found for the user. Please sign up.", 404),
    );
  }

  res.status(200).json({
    status: "success",
    data: { profile },
  });
};

// ═════════════════════════════════════════════════════════════
//TODO // 3/3/2026 UPDATE PROFILE  Done // height, weight, body fat, activity level, goal type, target weight
// ═════════════════════════════════════════════════════════════
export const updateProfile = async (req, res, next) => {
  const { heightCm, weightKg, bodyFat, activityLevel, goalType, targetWeight } =
    req.body;

  const updateData = {};
  if (heightCm !== undefined) updateData.heightCm = heightCm;
  if (weightKg !== undefined) updateData.weightKg = weightKg;
  if (bodyFat !== undefined) updateData.bodyFat = bodyFat;
  if (activityLevel !== undefined) updateData.activityLevel = activityLevel;
  if (targetWeight !== undefined) updateData.targetWeight = targetWeight;

  // ── Goal Change Flow ──────────────────────────────────
  if (goalType !== undefined) {
    updateData.goalType = goalType;

    // Deactivate current meal plan
    await MealPlan.updateMany(
      { user: req.user._id, isActive: true },
      { isActive: false },
    );

    // Deactivate current workout plan
    await WorkoutPlan.updateMany(
      { user: req.user._id, isActive: true },
      { isActive: false },
    );
  }

  // const profile = await User.findOneAndUpdate(
  //   { user: req.user._id },
  //   { $set: updateData },
  //   { new: true, upsert: true, runValidators: true },
  // ).populate("user", "name email phoneNumber gender dateOfBirth language");
  const profile = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateData },
    { new: true, runValidators: true },
  );

  res.status(200).json({
    status: "success",
    data: { profile },
    ...(goalType !== undefined && {
      message:
        "Goal updated. Previous plans deactivated. Please generate new plans.",
    }),
  });
};

// ═════════════════════════════════════════════════════════════
// LOG PROGRESS (weight, body fat)
// ═════════════════════════════════════════════════════════════
const logProgress = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { metricType, value, unit, recordedAt } = req.body;

    const progressLog = await ProgressLog.create({
      user: req.user._id,
      metricType,
      value,
      unit: unit || (metricType === "weight" ? "kg" : "%"),
      recordedAt: recordedAt || new Date(),
    });

    // If logging weight, also update profile
    if (metricType === "weight") {
      await User.findOneAndUpdate(
        { user: req.user._id },
        { weightKg: value },
        { upsert: true },
      );
    }

    if (metricType === "body_fat") {
      await User.findOneAndUpdate(
        { user: req.user._id },
        { bodyFat: value },
        { upsert: true },
      );
    }

    res.status(201).json({
      status: "success",
      data: { progressLog },
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════
// GET PROGRESS LOGS
// ═════════════════════════════════════════════════════════════
const getProgressLogs = async (req, res, next) => {
  try {
    const { metricType, startDate, endDate, limit = 50, page = 1 } = req.query;

    const filter = { user: req.user._id };

    if (metricType) filter.metricType = metricType;
    if (startDate || endDate) {
      filter.recordedAt = {};
      if (startDate) filter.recordedAt.$gte = new Date(startDate);
      if (endDate) filter.recordedAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [progressLogs, total] = await Promise.all([
      ProgressLog.find(filter)
        .sort({ recordedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ProgressLog.countDocuments(filter),
    ]);

    res.status(200).json({
      status: "success",
      results: progressLogs.length,
      total,
      page: parseInt(page),
      data: { progressLogs },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  // getProfile,
  // updateProfile,
  logProgress,
  getProgressLogs,
};
