import FoodService from "../services/foodService.js";

// ─────────────────────────────────────────────
// @desc    Get all meals (with pagination)
// @route   GET /api/meals
// ─────────────────────────────────────────────
export const getAllMeals = async (req, res, next) => {
  try {
    const data = await FoodService.getAll(req.query);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @desc    Get ALL meals (no pagination)
// @route   GET /api/meals/all
// ─────────────────────────────────────────────
export const getAllMealsNoPagination = async (req, res, next) => {
  try {
    const data = await FoodService.getAllNoPagination();
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @desc    Get single meal by id
// @route   GET /api/meals/:id
// ─────────────────────────────────────────────
export const getMealById = async (req, res, next) => {
  try {
    const data = await FoodService.getById(req.params.id);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @desc    Search meals by name
// @route   GET /api/meals/search?q=chicken
// ─────────────────────────────────────────────
export const searchMeals = async (req, res, next) => {
  try {
    const data = await FoodService.search(req.query.q, req.query);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @desc    Filter meals by category
// @route   GET /api/meals/category/:category
// ─────────────────────────────────────────────
export const getMealsByCategory = async (req, res, next) => {
  try {
    const data = await FoodService.getByCategory(
      req.params.category,
      req.query,
    );
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @desc    Filter meals by area / cuisine
// @route   GET /api/meals/area/:area
// ─────────────────────────────────────────────
export const getMealsByArea = async (req, res, next) => {
  try {
    const data = await FoodService.getByArea(req.params.area, req.query);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @desc    Filter meals by nutrition values
// @route   GET /api/meals/filter?minCalories=100&maxCalories=500
// ─────────────────────────────────────────────
export const filterMealsByNutrition = async (req, res, next) => {
  try {
    const data = await FoodService.filterByNutrition(req.query);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @desc    Get only ingredients of a meal
// @route   GET /api/meals/:id/ingredients
// ─────────────────────────────────────────────
export const getMealIngredients = async (req, res, next) => {
  try {
    const data = await FoodService.getIngredients(req.params.id);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};
