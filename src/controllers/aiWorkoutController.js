// ── AI Workout Controller ───────────────────────────────────
import { generateWorkoutPlan } from "../services/workoutAiService.js";
import AppError from "../utils/AppError.js";

/**
 * POST /api/v1/ai/workout-plan
 * Generate a smart AI-powered workout plan
 */
export const getWorkoutPlan = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const plan = await generateWorkoutPlan(userId, {
      fitness_goal: req.body.fitness_goal,
      target_weight: req.body.target_weight,
      target_time: req.body.target_time,
      workout_days: req.body.workout_days,
      injuries: req.body.injuries || [],
    });

    res.status(200).json({
      status: "success",
      data: plan,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }
    console.error("❌ Workout plan generation error:", err);
    next(new AppError(`Failed to generate workout plan: ${err.message}`, 500));
  }
};

export default { getWorkoutPlan };
