import Exercise from '../models/Exercise.js';
import ErrorResponse from '../utils/AppError.js';

class ExerciseService {
  /**
   * Get all exercises with pagination and optional filtering.
   */
  async getAll(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const total = await Exercise.countDocuments();
    const exercises = await Exercise.find()
      .select('-__v -_id -createdAt -updatedAt')
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      success: true,
      count: exercises.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: exercises,
    };
  }

  /**
   * Get all exercises without pagination in a single response.
   */
  async getAllNoPagination() {
    const total = await Exercise.countDocuments();
    const exercises = await Exercise.find()
      .select('-__v -_id -createdAt -updatedAt')
      .lean();

    return {
      success: true,
      count: exercises.length,
      total,
      data: exercises,
    };
  }

  /**
   * Get a single exercise by its custom ID (e.g., "0001").
   */
  async getById(id) {
    const exercise = await Exercise.findOne({ id })
      .select('-__v -_id -createdAt -updatedAt')
      .lean();

    if (!exercise) {
      throw new ErrorResponse(`Exercise not found with id: ${id}`, 404);
    }

    return { success: true, data: exercise };
  }

  /**
   * Get exercises filtered by body part.
   */
  async getByBodyPart(bodyPart, query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { bodyPart: bodyPart.toLowerCase() };
    const total = await Exercise.countDocuments(filter);
    const exercises = await Exercise.find(filter)
      .select('-__v -_id -createdAt -updatedAt')
      .skip(skip)
      .limit(limit)
      .lean();

    if (exercises.length === 0) {
      throw new ErrorResponse(`No exercises found for body part: ${bodyPart}`, 404);
    }

    return {
      success: true,
      count: exercises.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: exercises,
    };
  }

  /**
   * Get exercises filtered by target muscle.
   */
  async getByTarget(target, query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { target: target.toLowerCase() };
    const total = await Exercise.countDocuments(filter);
    const exercises = await Exercise.find(filter)
      .select('-__v -_id -createdAt -updatedAt')
      .skip(skip)
      .limit(limit)
      .lean();

    if (exercises.length === 0) {
      throw new ErrorResponse(`No exercises found for target muscle: ${target}`, 404);
    }

    return {
      success: true,
      count: exercises.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: exercises,
    };
  }

  /**
   * Get exercises filtered by equipment type.
   */
  async getByEquipment(equipment, query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { equipment: equipment.toLowerCase() };
    const total = await Exercise.countDocuments(filter);
    const exercises = await Exercise.find(filter)
      .select('-__v -_id -createdAt -updatedAt')
      .skip(skip)
      .limit(limit)
      .lean();

    if (exercises.length === 0) {
      throw new ErrorResponse(`No exercises found for equipment: ${equipment}`, 404);
    }

    return {
      success: true,
      count: exercises.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: exercises,
    };
  }

  /**
   * Search exercises by name using regex for partial matching.
   */
  async search(q, query = {}) {
    if (!q || q.trim() === '') {
      throw new ErrorResponse('Search query (q) is required', 400);
    }

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { name: { $regex: q, $options: 'i' } };
    const total = await Exercise.countDocuments(filter);
    const exercises = await Exercise.find(filter)
      .select('-__v -_id -createdAt -updatedAt')
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      success: true,
      count: exercises.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: exercises,
    };
  }

  /**
   * Get distinct values for a given field (bodyPart, equipment, target).
   */
  async getDistinct(field) {
    const allowedFields = ['bodyPart', 'equipment', 'target'];
    if (!allowedFields.includes(field)) {
      throw new ErrorResponse(`Invalid field: ${field}`, 400);
    }

    const values = await Exercise.distinct(field);
    return {
      success: true,
      count: values.length,
      data: values.sort(),
    };
  }
}

export default new ExerciseService();
