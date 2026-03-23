import crypto from "crypto";
import bcrypt from "bcryptjs";
import { OTP_EXPIRY_MINUTES } from "../config/constants.js";

/**
 * Generate a 6-digit numeric OTP.
 */
export const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hash an OTP using bcrypt.
 */
export const hashOtp = async (otp) => {
  return bcrypt.hash(otp, 10);
};

/**
 * Compare a plain OTP against its hash.
 */
export const verifyOtp = async (candidateOtp, hashedOtp) => {
  return bcrypt.compare(candidateOtp, hashedOtp);
};

/**
 * Calculate OTP expiration date from now.
 */
export const getOtpExpiry = () => {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
};

export const generateAndHashOTP = async () => {
  // const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const otp = crypto.randomInt(100000, 999999).toString();

  const hashedOtp = await bcrypt.hash(otp, 10);

  return { otp, hashedOtp };
};
