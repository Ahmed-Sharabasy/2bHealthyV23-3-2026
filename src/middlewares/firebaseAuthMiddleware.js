import admin from "firebase-admin";
import AppError from "../utils/AppError.js";

const firebaseAuthMiddleware = async (req, res, next) => {
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

  req.user = decoded;
  req.user._id = decoded.uid;
  console.log("req.user", req.user);
  next();
};

export default firebaseAuthMiddleware;
