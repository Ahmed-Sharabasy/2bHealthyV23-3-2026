import admin from "firebase-admin";
import AppError from "../utils/AppError.js";

const firebaseServiceAccount = JSON.parse(process.env.FIREBASE_SERVICE);

// admin.initializeApp({
//   credential: admin.credential.cert(firebaseServiceAccount),
// });

// ── Initialize Firebase Admin SDK ───────────────────────────
export const initFirebaseAdminSDK = () => {
  if (!firebaseServiceAccount) {
    throw new AppError("❌ Firebase initialization failed", 500);
  }

  admin.initializeApp({
    credential: admin.credential.cert(firebaseServiceAccount),
  });

  console.log("✅ Firebase Admin SDK initialized");
};

// // Initialize on module load
// initFirebaseAdminSDK();

// /**
//  * Send a push notification via Firebase Cloud Messaging.
//  * @param {string} fcmToken - The device FCM token
//  * @param {string} title - Notification title
//  * @param {string} body - Notification body
//  * @param {Object} data - Optional data payload
//  */
// export const sendPushNotification = async (
//   fcmToken,
//   title,
//   body,
//   data = {},
// ) => {
//   if (!firebaseInitialized) {
//     console.warn("⚠️  Firebase not initialized — skipping push notification");
//     return null;
//   }

//   const message = {
//     token: fcmToken,
//     notification: {
//       title,
//       body,
//     },
//     data: {
//       ...data,
//       click_action: "FLUTTER_NOTIFICATION_CLICK",
//     },
//     android: {
//       priority: "high",
//       notification: {
//         sound: "default",
//         channelId: "health_fitness_channel",
//       },
//     },
//     apns: {
//       payload: {
//         aps: {
//           sound: "default",
//           badge: 1,
//         },
//       },
//     },
//   };

//   const response = await admin.messaging().send(message);
//   return response;
// };

// /**
//  * Send push notification to multiple devices.
//  * @param {string[]} fcmTokens - Array of FCM tokens
//  * @param {string} title - Notification title
//  * @param {string} body - Notification body
//  * @param {Object} data - Optional data payload
//  */
// export const sendMulticastNotification = async (
//   fcmTokens,
//   title,
//   body,
//   data = {},
// ) => {
//   if (!firebaseInitialized) {
//     console.warn(
//       "⚠️  Firebase not initialized — skipping multicast notification",
//     );
//     return null;
//   }

//   const message = {
//     tokens: fcmTokens,
//     notification: {
//       title,
//       body,
//     },
//     data: {
//       ...data,
//       click_action: "FLUTTER_NOTIFICATION_CLICK",
//     },
//   };

//   const response = await admin.messaging().sendEachForMulticast(message);
//   return response;
// };

// export default { sendPushNotification, sendMulticastNotification };
