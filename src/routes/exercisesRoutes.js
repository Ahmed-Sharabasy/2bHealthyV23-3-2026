import { Router } from "express";
import * as exercisesController from "../controllers/exercisesController.js";

const router = Router();

router.route("/exercises").get(exercisesController.getExercises);
router.route("/exercisetypes").get(exercisesController.getExerciseTypes);
router.route("/exercises/search").get(exercisesController.getExerciseBySearch);
router.route("/exercises/:id").get(exercisesController.getExerciseById);
router.route("/muscles").get(exercisesController.getMuscles);
router.route("/bodyparts").get(exercisesController.getBodyParts);
router.route("/equipments").get(exercisesController.getEquipments);

export default router;
