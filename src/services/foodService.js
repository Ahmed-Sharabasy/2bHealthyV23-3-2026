import Meal from "../models/Meal.js";
import AppError from "../utils/AppError.js";

// ── Shared field exclusion ──────────────────────
const EXCLUDE_FIELDS = "-__v -_id -createdAt -updatedAt";

// ── Pagination helper ───────────────────────────
const paginate = async (filter, query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const total = await Meal.countDocuments(filter);
  const pages = Math.ceil(total / limit);

  const data = await Meal.find(filter)
    .select(EXCLUDE_FIELDS)
    .skip(skip)
    .limit(limit)
    .sort("-createdAt")
    .lean();

  return {
    count: data.length,
    total,
    page,
    pages,
    data,
  };
};

// ─────────────────────────────────────────────────
// Food Service — all business logic for meals
// ─────────────────────────────────────────────────
const FoodService = {
  /**
   * Get all meals with pagination
   * @param {Object} query - req.query (page, limit)
   */
  async getAll(query) {
    return paginate({}, query);
  },

  /**
   * Get ALL meals without pagination
   */
  async getAllNoPagination() {
    const data = await Meal.find()
      .select(EXCLUDE_FIELDS)
      .sort("-createdAt")
      .lean();

    return {
      count: data.length,
      data,
    };
  },

  /**
   * Get a single meal by its idMeal or MongoDB _id
   * @param {string} id
   */
  async getById(id) {
    // Try by custom idMeal field first
    let meal = await Meal.findOne({ idMeal: id }).select(EXCLUDE_FIELDS).lean();

    // Fall back to _id only if it's a valid ObjectId
    if (!meal && id.match(/^[0-9a-fA-F]{24}$/)) {
      meal = await Meal.findById(id).select(EXCLUDE_FIELDS).lean();
    }

    if (!meal) {
      throw new AppError(`No meal found with id: ${id}`, 404);
    }

    return meal;
  },

  /**
   * Search meals by name (case-insensitive regex)
   * @param {string} q - search term
   * @param {Object} query - req.query for pagination
   */
  async search(q, query) {
    if (!q || q.trim() === "") {
      throw new AppError("Please provide a search query using ?q=", 400);
    }

    // Escape special regex characters in user input
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filter = { strMeal: new RegExp(escaped, "i") };

    return paginate(filter, query);
  },

  /**
   * Get meals by category
   * @param {string} category
   * @param {Object} query - req.query for pagination
   */
  async getByCategory(category, query) {
    const filter = { strCategory: new RegExp(`^${category}$`, "i") };
    return paginate(filter, query);
  },

  /**
   * Get meals by area / cuisine
   * @param {string} area
   * @param {Object} query - req.query for pagination
   */
  async getByArea(area, query) {
    const filter = { strArea: new RegExp(`^${area}$`, "i") };
    return paginate(filter, query);
  },

  /**
   * Filter meals by nutrition values
   * @param {Object} query - req.query with minCalories, maxCalories, protein, carbs, fat
   */
  async filterByNutrition(query) {
    const { minCalories, maxCalories, protein, carbs, fat } = query;
    const filter = {};

    // Calorie range
    if (minCalories || maxCalories) {
      filter["nutrition.calories"] = {};
      if (minCalories)
        filter["nutrition.calories"].$gte = parseFloat(minCalories);
      if (maxCalories)
        filter["nutrition.calories"].$lte = parseFloat(maxCalories);
    }

    // Minimum macro filters (≥ value)
    if (protein) filter["nutrition.protein"] = { $gte: parseFloat(protein) };
    if (carbs) filter["nutrition.carbs"] = { $gte: parseFloat(carbs) };
    if (fat) filter["nutrition.fat"] = { $gte: parseFloat(fat) };

    return paginate(filter, query);
  },

  /**
   * Get only the ingredients of a specific meal
   * @param {string} id
   */
  async getIngredients(id) {
    let meal = await Meal.findOne({ idMeal: id })
      .select("strMeal ingredients -_id")
      .lean();

    if (!meal && id.match(/^[0-9a-fA-F]{24}$/)) {
      meal = await Meal.findById(id).select("strMeal ingredients -_id").lean();
    }

    if (!meal) {
      throw new AppError(`No meal found with id: ${id}`, 404);
    }

    return {
      mealName: meal.strMeal,
      ingredients: meal.ingredients,
    };
  },
};

export default FoodService;
