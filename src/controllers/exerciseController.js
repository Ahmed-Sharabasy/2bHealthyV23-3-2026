import AppError from '../utils/AppError.js';
import exerciseService from '../services/exerciseService.js';

/**
 * @desc    Get all exercises (paginated)
 * @route   GET /api/v1/exercises
 * @access  Public
 */
export const getAllExercises = async (req, res, next) => {
  try {
    const result = await exerciseService.getAll(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 400));
  }
};

/**
 * @desc    Get all exercises (no pagination)
 * @route   GET /api/v1/exercise/all
 * @access  Public
 */
export const getAllExercisesNoPagination = async (req, res, next) => {
  try {
    const result = await exerciseService.getAllNoPagination();
    res.status(200).json(result);
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 400));
  }
};

/**
 * @desc    Get single exercise by ID
 * @route   GET /api/v1/exercises/:id
 * @access  Public
 */
export const getExerciseById = async (req, res, next) => {
  try {
    const result = await exerciseService.getById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 400));
  }
};

/**
 * @desc    Get exercises by body part
 * @route   GET /api/v1/exercises/bodyPart/:bodyPart
 * @access  Public
 */
export const getExercisesByBodyPart = async (req, res, next) => {
  try {
    const result = await exerciseService.getByBodyPart(req.params.bodyPart, req.query);
    res.status(200).json(result);
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 400));
  }
};

/**
 * @desc    Get exercises by target muscle
 * @route   GET /api/v1/exercises/target/:muscle
 * @access  Public
 */
export const getExercisesByTarget = async (req, res, next) => {
  try {
    const result = await exerciseService.getByTarget(req.params.muscle, req.query);
    res.status(200).json(result);
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 400));
  }
};

/**
 * @desc    Get exercises by equipment
 * @route   GET /api/v1/exercises/equipment/:equipment
 * @access  Public
 */
export const getExercisesByEquipment = async (req, res, next) => {
  try {
    const result = await exerciseService.getByEquipment(req.params.equipment, req.query);
    res.status(200).json(result);
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 400));
  }
};

/**
 * @desc    Search exercises by name
 * @route   GET /api/v1/exercises/search?q=
 * @access  Public
 */
export const searchExercises = async (req, res, next) => {
  try {
    const result = await exerciseService.search(req.query.q, req.query);
    res.status(200).json(result);
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 400));
  }
};

/**
 * @desc    Get all distinct body parts
 * @route   GET /api/v1/bodyParts
 * @access  Public
 */
export const getBodyParts = async (req, res, next) => {
  try {
    const result = await exerciseService.getDistinct('bodyPart');
    res.status(200).json(result);
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 400));
  }
};

/**
 * @desc    Get all distinct equipment types
 * @route   GET /api/v1/equipments
 * @access  Public
 */
export const getEquipments = async (req, res, next) => {
  try {
    const result = await exerciseService.getDistinct('equipment');
    res.status(200).json(result);
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 400));
  }
};

/**
 * @desc    Get all distinct target muscles
 * @route   GET /api/v1/targets
 * @access  Public
 */
export const getTargets = async (req, res, next) => {
  try {
    const result = await exerciseService.getDistinct('target');
    res.status(200).json(result);
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 400));
  }
};
