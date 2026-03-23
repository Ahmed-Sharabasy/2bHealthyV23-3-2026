import { validationResult } from "express-validator";
import Meal from "../models/Meal.js";
import MealPlan from "../models/MealPlan.js";
import DailyMealLog from "../models/DailyMealLog.js";
import AppError from "../utils/AppError.js";

// ═════════════════════════════════════════════════════════════
// CREATE MEAL
// ═════════════════════════════════════════════════════════════
const createMeal = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const {
      name,
      calories,
      protein,
      carbs,
      fats,
      mealType,
      source,
      externalId,
      sourceApi,
    } = req.body;

    const meal = await Meal.create({
      name,
      calories,
      protein,
      carbs,
      fats,
      mealType,
      source: source || "manual",
      externalId,
      sourceApi,
    });

    res.status(201).json({
      status: "success",
      data: { meal },
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════
// GET MEALS (search / filter)
// ═════════════════════════════════════════════════════════════
const getMeals = async (req, res, next) => {
  try {
    const { mealType, source, search, limit = 20, page = 1 } = req.query;

    const filter = {};
    if (mealType) filter.mealType = mealType;
    if (source) filter.source = source;
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [meals, total] = await Promise.all([
      Meal.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Meal.countDocuments(filter),
    ]);

    res.status(200).json({
      status: "success",
      results: meals.length,
      total,
      page: parseInt(page),
      data: { meals },
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════
// GET MEAL BY ID
// ═════════════════════════════════════════════════════════════
const getMealById = async (req, res, next) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) {
      return next(new AppError("Meal not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: { meal },
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════
// GENERATE MEAL PLAN
// ═════════════════════════════════════════════════════════════
const generateMealPlan = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const {
      goalType,
      caloriesTarget,
      proteinTarget,
      carbsTarget,
      fatsTarget,
      startDate,
      endDate,
      aiModel,
    } = req.body;

    // Deactivate existing active meal plans for this user
    await MealPlan.updateMany(
      { user: req.user._id, isActive: true },
      { isActive: false },
    );

    // Create new meal plan
    const mealPlan = await MealPlan.create({
      user: req.user._id,
      goalType,
      caloriesTarget,
      proteinTarget: proteinTarget || 0,
      carbsTarget: carbsTarget || 0,
      fatsTarget: fatsTarget || 0,
      startDate,
      endDate,
      isActive: true,
      aiModel,
    });

    // ── External API Backup Strategy ──────────────────────
    // TODO: Integrate external nutrition API here:
    // 1) Fetch meals from external API based on goalType & macros
    // 2) Normalize response into Meal schema
    // 3) Save meals to DB (source: "external")
    // 4) Create DailyMealLog entries linking to saved meals
    // For now, return the plan shell for manual or AI population

    res.status(201).json({
      status: "success",
      data: { mealPlan },
      message:
        "Meal plan created. Populate daily meal logs via POST /meals/daily-log.",
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════
// GET ACTIVE MEAL PLAN
// ═════════════════════════════════════════════════════════════
const getMealPlan = async (req, res, next) => {
  try {
    const mealPlan = await MealPlan.findOne({
      user: req.user._id,
      isActive: true,
    });

    if (!mealPlan) {
      return next(new AppError("No active meal plan found", 404));
    }

    res.status(200).json({
      status: "success",
      data: { mealPlan },
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════
// LOG DAILY MEAL
// ═════════════════════════════════════════════════════════════
const logDailyMeal = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { mealPlanId, dayIndex, meals } = req.body;

    // Verify all meal IDs exist
    const mealIds = meals.map((m) => m.meal);
    const existingMeals = await Meal.find({ _id: { $in: mealIds } });
    if (existingMeals.length !== mealIds.length) {
      return next(new AppError("One or more meal IDs are invalid", 400));
    }

    const dailyMealLog = await DailyMealLog.create({
      user: req.user._id,
      mealPlan: mealPlanId || undefined,
      dayIndex,
      meals,
    });

    const populated = await DailyMealLog.findById(dailyMealLog._id).populate(
      "meals.meal",
    );

    res.status(201).json({
      status: "success",
      data: { dailyMealLog: populated },
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════
// GET DAILY MEAL LOGS
// ═════════════════════════════════════════════════════════════
const getDailyMealLogs = async (req, res, next) => {
  try {
    const { mealPlanId, startDate, endDate, limit = 30, page = 1 } = req.query;

    const filter = { user: req.user._id };
    if (mealPlanId) filter.mealPlan = mealPlanId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [dailyMealLogs, total] = await Promise.all([
      DailyMealLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("meals.meal"),
      DailyMealLog.countDocuments(filter),
    ]);

    res.status(200).json({
      status: "success",
      results: dailyMealLogs.length,
      total,
      page: parseInt(page),
      data: { dailyMealLogs },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createMeal,
  getMeals,
  getMealById,
  generateMealPlan,
  getMealPlan,
  logDailyMeal,
  getDailyMealLogs,
};
