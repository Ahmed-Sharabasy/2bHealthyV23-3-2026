// import admin from "firebase-admin";
// import env from "../config/env.js";

// // ── Initialize Firebase Admin SDK ───────────────────────────
// let firebaseInitialized = false;

// const initFirebase = () => {
//   if (firebaseInitialized) return;

//   try {
//     if (
//       env.FIREBASE_PROJECT_ID &&
//       env.FIREBASE_CLIENT_EMAIL &&
//       env.FIREBASE_PRIVATE_KEY
//     ) {
//       admin.initializeApp({
//         credential: admin.credential.cert({
//           projectId: env.FIREBASE_PROJECT_ID,
//           clientEmail: env.FIREBASE_CLIENT_EMAIL,
//           privateKey: env.FIREBASE_PRIVATE_KEY,
//         }),
//       });
//       firebaseInitialized = true;
//       console.log("✅ Firebase Admin SDK initialized");
//     } else {
//       console.warn(
//         "⚠️  Firebase credentials not configured — push notifications disabled",
//       );
//     }
//   } catch (error) {
//     console.error("❌ Firebase initialization failed:", error.message);
//   }
// };

// // Initialize on module load
// initFirebase();

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
