// import { validationResult } from "express-validator";
// import Notification from "../models/Notification.js";
// import User from "../models/User.js";
// import AppError from "../utils/AppError.js";
// import { sendPushNotification } from "../services/firebaseService.js";

// // ═════════════════════════════════════════════════════════════
// // GET NOTIFICATIONS (paginated, unread first)
// // ═════════════════════════════════════════════════════════════
// const getNotifications = async (req, res, next) => {
//   try {
//     const { isRead, type, limit = 20, page = 1 } = req.query;

//     const filter = { user: req.user._id };
//     if (isRead !== undefined) filter.isRead = isRead === "true";
//     if (type) filter.type = type;

//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     const [notifications, total, unreadCount] = await Promise.all([
//       Notification.find(filter)
//         .sort({ isRead: 1, createdAt: -1 }) // Unread first, then newest
//         .skip(skip)
//         .limit(parseInt(limit)),
//       Notification.countDocuments(filter),
//       Notification.countDocuments({ user: req.user._id, isRead: false }),
//     ]);

//     res.status(200).json({
//       status: "success",
//       results: notifications.length,
//       total,
//       unreadCount,
//       page: parseInt(page),
//       data: { notifications },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // ═════════════════════════════════════════════════════════════
// // MARK NOTIFICATION AS READ
// // ═════════════════════════════════════════════════════════════
// const markRead = async (req, res, next) => {
//   try {
//     const notification = await Notification.findOneAndUpdate(
//       { _id: req.params.id, user: req.user._id },
//       { isRead: true },
//       { new: true },
//     );

//     if (!notification) {
//       return next(new AppError("Notification not found", 404));
//     }

//     res.status(200).json({
//       status: "success",
//       data: { notification },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // ═════════════════════════════════════════════════════════════
// // MARK ALL NOTIFICATIONS AS READ
// // ═════════════════════════════════════════════════════════════
// const markAllRead = async (req, res, next) => {
//   try {
//     await Notification.updateMany(
//       { user: req.user._id, isRead: false },
//       { isRead: true },
//     );

//     res.status(200).json({
//       status: "success",
//       message: "All notifications marked as read",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // ═════════════════════════════════════════════════════════════
// // GET UNREAD COUNT
// // ═════════════════════════════════════════════════════════════
// const getUnreadCount = async (req, res, next) => {
//   try {
//     const count = await Notification.countDocuments({
//       user: req.user._id,
//       isRead: false,
//     });

//     res.status(200).json({
//       status: "success",
//       data: { unreadCount: count },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // ═════════════════════════════════════════════════════════════
// // SEND PUSH NOTIFICATION (admin / system)
// // ═════════════════════════════════════════════════════════════
// const sendNotification = async (req, res, next) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return next(new AppError(errors.array()[0].msg, 400));
//     }

//     const { userId, title, message, type } = req.body;

//     // Create notification record
//     const notification = await Notification.create({
//       user: userId,
//       title,
//       message,
//       type,
//     });

//     // Send Firebase push notification
//     const targetUser = await User.findById(userId);
//     if (targetUser && targetUser.fcmToken) {
//       try {
//         await sendPushNotification(targetUser.fcmToken, title, message, {
//           notificationId: notification._id.toString(),
//           type,
//         });
//       } catch (pushError) {
//         console.error("Push notification failed:", pushError.message);
//       }
//     }

//     res.status(201).json({
//       status: "success",
//       data: { notification },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // ═════════════════════════════════════════════════════════════
// // DELETE NOTIFICATION
// // ═════════════════════════════════════════════════════════════
// const deleteNotification = async (req, res, next) => {
//   try {
//     const notification = await Notification.findOneAndDelete({
//       _id: req.params.id,
//       user: req.user._id,
//     });

//     if (!notification) {
//       return next(new AppError("Notification not found", 404));
//     }

//     res.status(200).json({
//       status: "success",
//       message: "Notification deleted",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export default {
//   getNotifications,
//   markRead,
//   markAllRead,
//   getUnreadCount,
//   sendNotification,
//   deleteNotification,
// };
