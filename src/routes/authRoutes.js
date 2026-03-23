import { Router } from "express";
import rateLimit from "express-rate-limit";
// import authController from "../controllers/authController.js";
import * as authController from "../controllers/authController.js";

// todo will removed all validators and use class based validation instead
import {
  //   registerValidator,
  loginValidator,
  verifyEmailValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from "../validators/authValidator.js";

import { AuthValidator } from "../validators/authValidate.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

const authValidator = new AuthValidator();

const router = Router();

// ── Auth rate limiter (stricter) ────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    status: "fail",
    message: "Too many attempts. Please try again after 15 minutes.",
  },
});

// ── Public routes ───────────────────────────────────────────
// router.post(
//   "/register",
//   authLimiter,
//   registerValidator,
//   validateRequest,
//   authController.register,
// );

router
  .route("/signUp")
  .post(authValidator.validateSignUp(), validateRequest, authController.signUp);
router
  .route("/signIn")
  .post(authValidator.validateSignIn(), validateRequest, authController.signIn);
router
  .route("/getOtp")
  .post(
    authLimiter,
    authValidator.validateGetOtp(),
    validateRequest,
    authController.getOtp,
  );

router
  .route("/verifyEmail")
  .post(
    authValidator.validateVerifyEmail(),
    validateRequest,
    authController.verifyEmail,
  );

router
  .route("/forgotPassword")
  .post(
    authValidator.validateForgotPassword(),
    validateRequest,
    authController.forgotPassword,
  );

router
  .route("/resetPassword")
  .post(
    authValidator.validateResetPassword(),
    validateRequest,
    authController.resetPassword,
  );

// ── Protected routes // todo later 2/3/2026 ────────────────────────────────────────
router.get("/me", authMiddleware, authController.getMe);
router.patch("/fcm-token", authMiddleware, authController.updateFcmToken);

export default router;
