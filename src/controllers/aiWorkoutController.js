// ── AI Workout Controller ───────────────────────────────────
import { generateWorkoutPlan } from "../services/workoutAiService.js";
import AppError from "../utils/AppError.js";

/**
 * POST /api/v1/ai/workout-plan
 *
 * Body:
 *   - fitness_goal: "fat_loss" | "muscle_gain" | "weight_gain" | "weight_loss" | "maintenance"
 *   - target_weight: number (kg)
 *   - target_time: string (e.g. "1 months", "2 weeks")
 *   - workout_days: string[] (e.g. ["Monday", "Wednesday", "Friday"])
 *   - injuries: string[] (e.g. ["triceps"])
 */
export const getWorkoutPlan = async (req, res, next) => {
  const start = Date.now();

  try {
    const {
      fitness_goal,
      target_weight,
      target_time,
      workout_days,
      injuries = [],
    } = req.body;

    console.log(`\n🏋️ ═══ Workout Plan Request ═══`);
    console.log(
      `   Goal: ${fitness_goal}, Target: ${target_weight}kg, Duration: ${target_time}`,
    );
    console.log(`   Days: ${workout_days.join(", ")}`);
    if (injuries.length) console.log(`   Injuries: ${injuries.join(", ")}`);

    // Generate plan
    const result = await generateWorkoutPlan(req.user._id, {
      fitness_goal,
      target_weight,
      target_time,
      workout_days,
      injuries,
    });

    // Safety check
    if (!result || !Array.isArray(result.plan) || result.plan.length === 0) {
      return next(new AppError("AI returned an empty workout plan", 500));
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(
      `✅ Workout plan ready: ${result.plan.length} days in ${elapsed}s`,
    );

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.error(`❌ Workout plan failed (${elapsed}s): ${err.message}`);

    if (err instanceof AppError) return next(err);
    next(new AppError(`Failed to generate workout plan: ${err.message}`, 500));
  }
};

export default { getWorkoutPlan };
