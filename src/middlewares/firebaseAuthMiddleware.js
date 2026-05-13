import admin from "firebase-admin";
import AppError from "../utils/AppError.js";

const firebaseAuthMiddleware = async (req, res, next) => {
  console.log("token", req.headers.authorization?.split(" ")[1]);
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access", 401),
    );
  }

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (error) {
    return next(new AppError(error.message, 401));
  }

  const userRef = admin.firestore().collection("users").doc(decoded.user_id);
  const doc = await userRef.get();

  if (!doc.exists) {
    return next(new AppError("User not found", 404));
  }

  req.decodedUser = decoded;
  req.decodedUser.token = token;
  req.user = doc.data();

  console.log("req.user", req.user);
  next();
};

export default firebaseAuthMiddleware;
