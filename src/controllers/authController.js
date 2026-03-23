import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import User from "../models/User.js";
import env from "../config/env.js";
import AppError from "../utils/AppError.js";
import {
  generateOtp,
  hashOtp,
  verifyOtp,
  getOtpExpiry,
  generateAndHashOTP,
} from "../utils/otpHelper.js";
import {
  sendOtpEmail,
  sendPasswordResetEmail,
} from "../services/emailService.js";

// ── Helper: sign JWT ────────────────────────────────────────
const signToken = (id, email) => {
  return jwt.sign({ id, email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

// ── Helper: send token response ─────────────────────────────
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id, user.email);

  // Remove password from output
  // const userObj = user.toObject();
  // delete userObj.password;
  // delete userObj.otpHash;
  // delete userObj.otpExpiresAt;
  // delete userObj.passwordResetOtpHash;
  // delete userObj.passwordResetExpiresAt;

  res.status(statusCode).json({
    status: "success",
    token,
    // data: { user: userObj },
    data: { user },
  });
};

// ═════════════════════════════════════════════════════════════
// REGISTER
// ═════════════════════════════════════════════════════════════
// const register = async (req, res, next) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return next(new AppError(errors.array()[0].msg, 400));
//     }

//     const {
//       name,
//       email,
//       password,
//       phoneNumber,
//       gender,
//       dateOfBirth,
//       language,
//     } = req.body;

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return next(new AppError("Email already registered", 400));
//     }

//     // Generate OTP for email verification
//     const otp = generateOtp();
//     const otpHash = await hashOtp(otp);
//     const otpExpiresAt = getOtpExpiry();

//     // Create user
//     const user = await User.create({
//       name,
//       email,
//       password,
//       phoneNumber,
//       gender,
//       dateOfBirth,
//       language,
//       otpHash,
//       otpExpiresAt,
//     });

//     // Send OTP via email
//     try {
//       await sendOtpEmail(email, otp);
//     } catch (emailError) {
//       console.error("Email sending failed:", emailError.message);
//       // Don't block registration if email fails
//     }

//     createSendToken(user, 201, res);
//   } catch (error) {
//     next(error);
//   }
// };

// ═════════════════════════════════════════════════════════════
// todo now is signup  2/3/2026 // Done
export const signUp = async (req, res) => {
  const { name, email, password, phoneNumber, gender, dateOfBirth, language } =
    req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("Email already registered", 400));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phoneNumber,
    gender,
    dateOfBirth,
    language,
  });

  createSendToken(user, 201, res);
};

// ═════════════════════════════════════════════════════════════
//todo Login new version 2/3/2026 // Done
export const signIn = async (req, res, next) => {
  const { email, password } = req.body;

  // Find user with password
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new AppError("Invalid email or password", 401));
  }

  // Check if account is active
  if (!user.isActive) {
    return next(new AppError("Your account has been deactivated", 403));
  }

  // Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new AppError("Invalid email or password", 401));
  }

  createSendToken(user, 200, res);
};

// ═════════════════════════════════════════════════════════════
// todo 2/3/2026 send OTP email after sign up
export const getOtp = async (req, res, next) => {
  const { email } = req.body;
  // check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (user.isEmailVerified) {
    return next(new AppError("Email is already verified", 400));
  }
  // generate OTP
  // const { otp, hashedOtp } = await generateAndHashOTP();
  // console.log(otp, hashedOtp);

  // send OTP to email
  // await sendEmail({
  //   to: user.email,
  //   subject: "your OTP Code",
  //   html: `<h1>OTP: ${otp}</h1>`,
  //   text: `OTP: ${otp}`,
  // });
  // Generate OTP for email verification
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const otpExpiresAt = getOtpExpiry();

  await sendOtpEmail(user.email, otp);

  // save hashed OTP to DB
  // user.otp = hashedOtp;
  user.otpHash = otpHash;
  user.otpExpiresAt = otpExpiresAt;
  // await user.save({ validateBeforeSave: false });
  await user.save();

  res.status(200).json({
    status: "success",
    message: "OTP sent to email",
    data: { user },
  });
};
// ═════════════════════════════════════════════════════════════
//todo  VERIFY EMAIL // Done
// ═════════════════════════════════════════════════════════════
export const verifyEmail = async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select("+otpHash +otpExpiresAt");
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (user.isEmailVerified) {
    return next(new AppError("Email is already verified", 400));
  }

  if (!user.otpHash || !user.otpExpiresAt) {
    return next(new AppError("No OTP found. Please request a new one.", 400));
  }

  // Check expiry
  if (user.otpExpiresAt < Date.now()) {
    return next(
      new AppError("OTP has expired. Please request a new one.", 400),
    );
  }

  // Verify OTP
  const isValid = await verifyOtp(otp, user.otpHash);
  if (!isValid) {
    return next(new AppError("Invalid OTP", 400));
  }

  // Mark as verified and invalidate OTP
  user.isEmailVerified = true;
  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Email verified successfully",
  });
};

// ═════════════════════════════════════════════════════════════
//? will removed or changed to getotp RESEND OTP // done
// ═════════════════════════════════════════════════════════════
export const resendOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.isEmailVerified) {
      return next(new AppError("Email is already verified", 400));
    }

    // Generate new OTP
    const otp = generateOtp();
    const otpHashed = await hashOtp(otp);

    user.otpHash = otpHashed;
    user.otpExpiresAt = getOtpExpiry();
    await user.save({ validateBeforeSave: false });

    await sendOtpEmail(email, otp);

    res.status(200).json({
      status: "success",
      message: "OTP sent successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════
// ? will removed or change LOGIN
// ═════════════════════════════════════════════════════════════
export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(new AppError("Invalid email or password", 401));
    }

    // Check if account is active
    if (!user.isActive) {
      return next(new AppError("Your account has been deactivated", 403));
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError("Invalid email or password", 401));
    }

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════
// FORGOT PASSWORD
// ═════════════════════════════════════════════════════════════
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("No user found with that email", 404));
  }

  // Generate password reset OTP
  const otp = generateOtp();
  const otpHashed = await hashOtp(otp);

  user.passwordResetOtpHash = otpHashed;
  user.passwordResetExpiresAt = getOtpExpiry();
  await user.save({ validateBeforeSave: false });

  await sendPasswordResetEmail(email, otp);

  res.status(200).json({
    status: "success",
    message: "Password reset OTP sent to your email",
  });
};

// ═════════════════════════════════════════════════════════════
// RESET PASSWORD
// ═════════════════════════════════════════════════════════════
export const resetPassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email }).select(
    "+passwordResetOtpHash +passwordResetExpiresAt",
  );
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (!user.passwordResetOtpHash || !user.passwordResetExpiresAt) {
    return next(new AppError("No password reset request found", 400));
  }

  // Check expiry
  if (user.passwordResetExpiresAt < Date.now()) {
    return next(new AppError("Reset OTP has expired", 400));
  }

  // Verify OTP
  const isValid = await verifyOtp(otp, user.passwordResetOtpHash);
  if (!isValid) {
    return next(new AppError("Invalid OTP", 400));
  }

  // Update password and clear reset fields
  user.password = newPassword;
  user.passwordResetOtpHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  createSendToken(user, 200, res);
};

// ═════════════════════════════════════════════════════════════
// GET ME (current user)
// ═════════════════════════════════════════════════════════════
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════
// UPDATE FCM TOKEN
// ═════════════════════════════════════════════════════════════
export const updateFcmToken = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return next(new AppError("FCM token is required", 400));
    }

    await User.findByIdAndUpdate(req.user._id, { fcmToken });

    res.status(200).json({
      status: "success",
      message: "FCM token updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// export default {
//   // register,
//   verifyEmail,
//   resendOtp,
//   login,
//   forgotPassword,
//   resetPassword,
//   getMe,
//   updateFcmToken,
// };
