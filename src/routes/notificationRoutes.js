// import { Router } from "express";
// import notificationController from "../controllers/notificationController.js";
// import { sendNotificationValidator } from "../validators/notificationValidator.js";
// import authMiddleware from "../middlewares/authMiddleware.js";
// import validateRequest from "../middlewares/validateRequest.js";

// const router = Router();

// // ── All routes are protected ────────────────────────────────
// router.use(authMiddleware);

// router.get("/", notificationController.getNotifications);
// router.get("/unread-count", notificationController.getUnreadCount);
// router.patch("/:id/read", notificationController.markRead);
// router.patch("/read-all", notificationController.markAllRead);
// router.post(
//   "/send",
//   sendNotificationValidator,
//   validateRequest,
//   notificationController.sendNotification,
// );
// router.delete("/:id", notificationController.deleteNotification);

// export default router;
