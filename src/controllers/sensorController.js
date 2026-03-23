// import { validationResult } from "express-validator";
// import SensorReading from "../models/SensorReading.js";
// import DailySteps from "../models/DailySteps.js";
// import Device from "../models/Device.js";
// import Notification from "../models/Notification.js";
// import AppError from "../utils/AppError.js";
// import { STEP_MILESTONES } from "../config/constants.js";
// import { sendPushNotification } from "../services/firebaseService.js";

// // ── Helper: normalize date to midnight ──────────────────────
// const toDateOnly = (date) => {
//   const d = new Date(date);
//   d.setHours(0, 0, 0, 0);
//   return d;
// };

// // ═════════════════════════════════════════════════════════════
// // SUBMIT SINGLE READING
// // ═════════════════════════════════════════════════════════════
// const submitReading = async (req, res, next) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return next(new AppError(errors.array()[0].msg, 400));
//     }

//     const { deviceId, type, value, recordedAt } = req.body;

//     // Validate device ownership
//     const device = await Device.findOne({
//       _id: deviceId,
//       user: req.user._id,
//     });
//     if (!device) {
//       return next(
//         new AppError("Device not found or does not belong to you", 404),
//       );
//     }

//     // Store sensor reading
//     const sensorReading = await SensorReading.create({
//       user: req.user._id,
//       device: deviceId,
//       type,
//       value,
//       recordedAt: recordedAt || new Date(),
//     });

//     // ── Aggregate steps ─────────────────────────────────
//     if (type === "steps") {
//       const dateOnly = toDateOnly(recordedAt || new Date());

//       const dailySteps = await DailySteps.findOneAndUpdate(
//         { user: req.user._id, date: dateOnly },
//         { $inc: { steps: value } },
//         { upsert: true, new: true },
//       );

//       // Check step milestones
//       await checkStepMilestones(req.user, dailySteps.steps);
//     }

//     // Update device lastSeen
//     device.lastSeen = new Date();
//     device.isConnected = true;
//     await device.save();

//     res.status(201).json({
//       status: "success",
//       data: { sensorReading },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // ═════════════════════════════════════════════════════════════
// // SYNC DEVICE (batch readings)
// // ═════════════════════════════════════════════════════════════
// const syncDevice = async (req, res, next) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return next(new AppError(errors.array()[0].msg, 400));
//     }

//     const { deviceUUID, readings } = req.body;

//     // Validate device ownership
//     const device = await Device.findOne({
//       deviceUUID,
//       user: req.user._id,
//     });
//     if (!device) {
//       return next(
//         new AppError("Device not found or does not belong to you", 404),
//       );
//     }

//     // Store all readings
//     const sensorReadings = await SensorReading.insertMany(
//       readings.map((r) => ({
//         user: req.user._id,
//         device: device._id,
//         type: r.type,
//         value: r.value,
//         recordedAt: r.recordedAt || new Date(),
//       })),
//     );

//     // Aggregate steps by date
//     const stepReadings = readings.filter((r) => r.type === "steps");
//     if (stepReadings.length > 0) {
//       // Group step values by date
//       const stepsByDate = {};
//       for (const r of stepReadings) {
//         const dateKey = toDateOnly(r.recordedAt || new Date()).toISOString();
//         stepsByDate[dateKey] = (stepsByDate[dateKey] || 0) + r.value;
//       }

//       // Upsert each date
//       for (const [dateStr, totalSteps] of Object.entries(stepsByDate)) {
//         const dailySteps = await DailySteps.findOneAndUpdate(
//           { user: req.user._id, date: new Date(dateStr) },
//           { $inc: { steps: totalSteps } },
//           { upsert: true, new: true },
//         );
//         await checkStepMilestones(req.user, dailySteps.steps);
//       }
//     }

//     // Update device lastSeen
//     device.lastSeen = new Date();
//     device.isConnected = true;
//     await device.save();

//     res.status(201).json({
//       status: "success",
//       results: sensorReadings.length,
//       data: { sensorReadings },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // ═════════════════════════════════════════════════════════════
// // GET READINGS
// // ═════════════════════════════════════════════════════════════
// const getReadings = async (req, res, next) => {
//   try {
//     const { type, startDate, endDate, limit = 50, page = 1 } = req.query;

//     const filter = { user: req.user._id };
//     if (type) filter.type = type;
//     if (startDate || endDate) {
//       filter.recordedAt = {};
//       if (startDate) filter.recordedAt.$gte = new Date(startDate);
//       if (endDate) filter.recordedAt.$lte = new Date(endDate);
//     }

//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     const [readings, total] = await Promise.all([
//       SensorReading.find(filter)
//         .sort({ recordedAt: -1 })
//         .skip(skip)
//         .limit(parseInt(limit))
//         .populate("device", "deviceUUID model"),
//       SensorReading.countDocuments(filter),
//     ]);

//     res.status(200).json({
//       status: "success",
//       results: readings.length,
//       total,
//       page: parseInt(page),
//       data: { readings },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // ═════════════════════════════════════════════════════════════
// // GET DAILY STEPS
// // ═════════════════════════════════════════════════════════════
// const getDailySteps = async (req, res, next) => {
//   try {
//     const { startDate, endDate, limit = 30 } = req.query;

//     const filter = { user: req.user._id };
//     if (startDate || endDate) {
//       filter.date = {};
//       if (startDate) filter.date.$gte = new Date(startDate);
//       if (endDate) filter.date.$lte = new Date(endDate);
//     }

//     const dailySteps = await DailySteps.find(filter)
//       .sort({ date: -1 })
//       .limit(parseInt(limit));

//     res.status(200).json({
//       status: "success",
//       results: dailySteps.length,
//       data: { dailySteps },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // ═════════════════════════════════════════════════════════════
// // HELPER: Check step milestones and create notifications
// // ═════════════════════════════════════════════════════════════
// async function checkStepMilestones(user, currentSteps) {
//   try {
//     for (const milestone of STEP_MILESTONES) {
//       if (currentSteps >= milestone) {
//         // Check if notification for this milestone was already sent today
//         const today = toDateOnly(new Date());
//         const tomorrow = new Date(today);
//         tomorrow.setDate(tomorrow.getDate() + 1);

//         const existingNotification = await Notification.findOne({
//           user: user._id,
//           type: "milestone",
//           title: `${milestone.toLocaleString()} Steps Milestone!`,
//           createdAt: { $gte: today, $lt: tomorrow },
//         });

//         if (!existingNotification) {
//           await Notification.create({
//             user: user._id,
//             title: `${milestone.toLocaleString()} Steps Milestone!`,
//             message: `Congratulations! You've reached ${milestone.toLocaleString()} steps today! Keep going!`,
//             type: "milestone",
//           });

//           // Send push notification if user has FCM token
//           if (user.fcmToken) {
//             try {
//               await sendPushNotification(
//                 user.fcmToken,
//                 `${milestone.toLocaleString()} Steps Milestone!`,
//                 `You've reached ${milestone.toLocaleString()} steps today!`,
//               );
//             } catch (pushError) {
//               console.error("Push notification failed:", pushError.message);
//             }
//           }
//         }
//       }
//     }
//   } catch (error) {
//     console.error("Step milestone check failed:", error.message);
//   }
// }

// export default {
//   submitReading,
//   syncDevice,
//   getReadings,
//   getDailySteps,
// };
