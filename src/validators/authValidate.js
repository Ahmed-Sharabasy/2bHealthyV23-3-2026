import { body } from "express-validator";
import { GENDERS, LANGUAGES } from "../config/constants.js";

export class AuthValidator {
  // Sign up
  validateSignUp() {
    return [
      body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ max: 100 })
        .withMessage("Name cannot exceed 100 characters"),
      body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),
      body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters"),
      body("phoneNumber")
        .optional()
        .trim()
        .isMobilePhone()
        .withMessage("Please provide a valid phone number"),
      body("gender")
        .optional()
        .isIn(GENDERS)
        .withMessage(`Gender must be one of: ${GENDERS.join(", ")}`),
      body("dateOfBirth")
        .optional()
        .isISO8601()
        .withMessage("Date of birth must be a valid date"),
      body("language")
        .optional()
        .isIn(LANGUAGES)
        .withMessage(`Language must be one of: ${LANGUAGES.join(", ")}`),
    ];
  }
  // Sign in
  validateSignIn() {
    return [
      body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),
      body("password").notEmpty().withMessage("Password is required"),
    ];
  }

  // validate get otp
  validateGetOtp() {
    return [
      body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),
    ];
  }

  // validate verifyEmailValidator
  validateVerifyEmail() {
    return [
      body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),
      body("otp")
        .trim()
        .notEmpty()
        .withMessage("OTP is required")
        .isLength({ min: 6, max: 6 })
        .withMessage("OTP must be 6 digits")
        .isNumeric()
        .withMessage("OTP must be numeric"),
    ];
  }

  // validate forgot password
  validateForgotPassword() {
    return [
      body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),
    ];
  }

  // Reset Password
  validateResetPassword() {
    return [
      body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),
      body("otp")
        .trim()
        .notEmpty()
        .withMessage("OTP is required")
        .isLength({ min: 6, max: 6 })
        .withMessage("OTP must be 6 digits")
        .isNumeric()
        .withMessage("OTP must be numeric"),
      body("newPassword")
        .notEmpty()
        .withMessage("New password is required")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters"),
    ];
  }

  // // POST
  // validatePostCreation() {
  //   return [
  //     body("content")
  //       .trim()
  //       .notEmpty()
  //       .withMessage("Post content is required")
  //       .isLength({ max: 5000 })
  //       .withMessage("Post content cannot exceed 5000 characters"),
  //     body("image").optional(),
  //   ];
  // }
  // // validate toggleLike
  // validateToggleLike() {
  //   return [
  //     body("postId")
  //       .trim()
  //       .notEmpty()
  //       .withMessage("Post ID is required")
  //       .isMongoId()
  //       .withMessage("Invalid Post ID"),
  //     body("userId")
  //       .trim()
  //       .notEmpty()
  //       .withMessage("User ID is required")
  //       .isMongoId()
  //       .withMessage("Invalid User ID"),
  //   ];
  // }
  // // validate get all comments for a post
  // validateGetComments() {
  //   return [
  //     body("postId")
  //       .trim()
  //       .notEmpty()
  //       .withMessage("Post ID is required")
  //       .isMongoId()
  //       .withMessage("Invalid Post ID"),
  //   ];
  // }

  // // validate create comment on postId, userId, content
  // validateCommentCreationOnPost() {
  //   return [
  //     body("postId")
  //       .trim()
  //       .notEmpty()
  //       .withMessage("Post ID is required")
  //       .isMongoId()
  //       .withMessage("Invalid Post ID"),

  //     body("userId")
  //       .trim()
  //       .notEmpty()
  //       .withMessage("User ID is required")
  //       .isMongoId()
  //       .withMessage("Invalid User ID"),

  //     body("content")
  //       .trim()
  //       .notEmpty()
  //       .withMessage("Comment content is required")
  //       .isLength({ max: 1000 })
  //       .withMessage("Comment content cannot exceed 1000 characters"),
  //   ];
  // }
}
