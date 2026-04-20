// ── AI Meal Controller ──────────────────────────────────────
import { generateMealPlan } from "../services/mealAiService.js";
import AppError from "../utils/AppError.js";

/**
 * POST /api/v1/ai/meal-plan
 *
 * Body:
 *   - fitness_goal: "fat_loss" | "weight_gain"
 *   - target_weight: number (kg)
 *   - target_time: string (e.g. "1 month", "2 weeks")
 *   - excluded_foods: string[] (category names to exclude)
 */
export const getMealPlan = async (req, res, next) => {
  const start = Date.now();

  try {
    const { fitness_goal, target_weight, target_time, excluded_foods = [] } =
      req.body;

    console.log(`\n🍽️ ═══ Meal Plan Request ═══`);
    console.log(
      `   Goal: ${fitness_goal}, Target: ${target_weight}kg, Duration: ${target_time}`,
    );
    if (excluded_foods.length)
      console.log(`   Excluded: ${excluded_foods.join(", ")}`);

    // Generate plan
    const result = await generateMealPlan({
      fitness_goal,
      target_weight,
      target_time,
      excluded_foods,
    });

    // Safety check
    if (!result || !Array.isArray(result.plan) || result.plan.length === 0) {
      return next(new AppError("AI returned an empty meal plan", 500));
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`✅ Meal plan ready: ${result.plan.length} days in ${elapsed}s`);

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.error(`❌ Meal plan failed (${elapsed}s): ${err.message}`);

    if (err instanceof AppError) return next(err);
    next(new AppError(`Failed to generate meal plan: ${err.message}`, 500));
  }
};

export default { getMealPlan };
