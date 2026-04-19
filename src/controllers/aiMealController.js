// ── AI Meal Controller ──────────────────────────────────────
import { generateMealPlan } from "../services/mealAiService.js";
import AppError from "../utils/AppError.js";

/**
 * POST /api/v1/ai/meal-plan
 * Generate a smart AI-powered 30-day meal plan
 *
 * Body:
 *   - fitness_goal: "weight_loss" | "weight_gain" | "fat_loss" | "muscle_gain" | "maintenance"
 *   - target_weight: number (kg)
 *   - target_time: string (e.g. "3 months")
 *   - weight: number (current weight in kg)
 *   - height: number (height in cm)
 *   - age: number
 *   - gender: "male" | "female"
 *   - preferred_foods?: string[]
 *   - excluded_foods?: string[]
 */
export const getMealPlan = async (req, res, next) => {
  try {
    const { fitness_goal } = req.body;

    // ── Validate required fields ─────────────────────────────
    if (!fitness_goal) {
      return next(new AppError("fitness_goal is required", 400));
    }

    const validGoals = [
      "fat_loss",
      "muscle_gain",
      "weight_gain",
      "weight_loss",
      "maintenance",
    ];
    if (!validGoals.includes(fitness_goal)) {
      return next(
        new AppError(
          `Invalid fitness_goal. Must be one of: ${validGoals.join(", ")}`,
          400,
        ),
      );
    }

    // ── Generate meal plan ───────────────────────────────────
    const plan = await generateMealPlan({
      fitness_goal,
      target_weight: req.body.target_weight,
      target_time: req.body.target_time,
      weight: req.body.weight || 70,
      height: req.body.height || 170,
      age: req.body.age || 25,
      gender: req.body.gender || "male",
      preferred_foods: req.body.preferred_foods || [],
      excluded_foods: req.body.excluded_foods || [],
    });

    // ── Verify response structure ────────────────────────────
    if (!plan || !Array.isArray(plan.plan) || plan.plan.length === 0) {
      return next(
        new AppError("AI generated an empty or invalid meal plan", 500),
      );
    }

    // ── Return structured response ───────────────────────────
    res.status(200).json({
      status: "success",
      data: {
        goal: plan.goal,
        dailyCalories: plan.dailyCalories,
        waterLiters: plan.waterLiters,
        totalDays: plan.totalDays,
        averageCalories: plan.averageCalories,
        plan: plan.plan,
      },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }
    console.error("❌ Meal plan generation error:", err);
    next(new AppError(`Failed to generate meal plan: ${err.message}`, 500));
  }
};

export default { getMealPlan };
