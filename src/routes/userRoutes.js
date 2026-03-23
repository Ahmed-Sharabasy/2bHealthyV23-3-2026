import { Router } from "express";
// import userController from "../controllers/userController.js";
import * as userController from "../controllers/userController.js";
// import {
//   updateProfileValidator,
//   logProgressValidator,
// } from "../validators/userValidator.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

import { UserValidator } from "../validators/userValidate.js";

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

// router.put(
//   "/profile",
//   updateProfileValidator,
//   validateRequest,
//   userController.updateProfile,
// );
// router.post(
//   "/progress",
//   logProgressValidator,
//   validateRequest,
//   userController.logProgress,
// );
// router.get("/progress", userController.getProgressLogs);

export default router;
