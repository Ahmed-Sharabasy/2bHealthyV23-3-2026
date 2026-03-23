// ── AI Meal Controller ──────────────────────────────────────
import { generateMealPlan } from "../services/mealAiService.js";
import AppError from "../utils/AppError.js";

/**
 * POST /api/v1/ai/meal-plan
 * Generate a smart AI-powered meal plan
 */
export const getMealPlan = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const plan = await generateMealPlan(userId, {
      fitness_goal: req.body.fitness_goal,
      target_weight: req.body.target_weight,
      target_time: req.body.target_time,
      preferred_foods: req.body.preferred_foods || [],
      excluded_foods: req.body.excluded_foods || [],
    });

    res.status(200).json({
      status: "success",
      data: plan,
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
