import { Router } from "express";
// import userController from "../controllers/userController.js";
import * as userController from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

import { UserValidator } from "../validators/userValidator.js";

import * as photoUploadMiddleware from "../middlewares/multerConfig.js";

const router = Router();

const userValidator = new UserValidator();

// ── All routes are protected ────────────────────────────────
router.use(authMiddleware);

router.get("/profile", userController.getProfile);

// update profile data like height, weight, body fat, activity level, goal type, target weight
router
  .route("/profile")
  .patch(
    userValidator.validateUpdateProfile(),
    validateRequest,
    userController.updateProfile,
  );

// upload avatar
router
  .route("/uploadUserAvatar")
  .patch(
    photoUploadMiddleware.uploadRowUserAvatar,
    photoUploadMiddleware.resizeUserPhoto,
    userController.uploadUserAvatar,
  );

export default router;
