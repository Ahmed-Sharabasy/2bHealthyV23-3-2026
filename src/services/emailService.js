import nodemailer from "nodemailer";
import env from "../config/env.js";

// ── Create reusable transporter ─────────────────────────────
const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: env.EMAIL_PORT === 465,
  auth: {
    // user: env.EMAIL_USER,
    // pass: env.EMAIL_PASS,
    user: env.EMAIL_USERNAME,
    pass: env.EMAIL_PASSWORD,
  },
});

/**
 * Send an email.
 * @param {Object} options - { to, subject, html }
 */
export const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `Health & Fitness App <${env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send OTP email for email verification.
 */
export const sendOtpEmail = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: "Verify Your Email — Health & Fitness App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2d3748;">Email Verification</h2>
        <p>Your verification code is:</p>
        <div style="background: #f7fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2b6cb0;">${otp}</span>
        </div>
        <p style="color: #718096; font-size: 14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
  });
};

/**
 * Send OTP email for password reset.
 */
export const sendPasswordResetEmail = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: "Password Reset — Health & Fitness App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2d3748;">Password Reset</h2>
        <p>Your password reset code is:</p>
        <div style="background: #fff5f5; border: 2px solid #fed7d7; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #c53030;">${otp}</span>
        </div>
        <p style="color: #718096; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
};

export default { sendEmail, sendOtpEmail, sendPasswordResetEmail };
