import express from 'express';
const router = express.Router();
import {
  getAllExercises,
  getAllExercisesNoPagination,
  getExerciseById,
  getExercisesByBodyPart,
  getExercisesByTarget,
  getExercisesByEquipment,
  searchExercises,
  getBodyParts,
  getEquipments,
  getTargets,
} from '../controllers/exerciseController.js';

// Search must come before :id to avoid treating "search" as an id
router.get('/search', searchExercises);

// Distinct value routes
router.get('/bodyParts', getBodyParts);
router.get('/equipments', getEquipments);
router.get('/targets', getTargets);

// Route for getting all items together without pagination
router.get('/all', getAllExercisesNoPagination);

// Main CRUD-like routes
router.get('/', getAllExercises);
router.get('/:id', getExerciseById);

// Filter routes
router.get('/bodyPart/:bodyPart', getExercisesByBodyPart);
router.get('/target/:muscle', getExercisesByTarget);
router.get('/equipment/:equipment', getExercisesByEquipment);

export default router;
