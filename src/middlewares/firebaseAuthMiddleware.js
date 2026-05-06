import admin from "firebase-admin";
import AppError from "../utils/AppError.js";

const firebaseAuthMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    throw new AppError(
      "You are not logged in! Please log in to get access",
      401,
    );
  }

  const decoded = await admin.auth().verifyIdToken(token);

  if (!decoded) {
    throw new AppError("Invalid token", 401);
  }

  req.user = decoded;
  req.user._id = decoded.uid;
  console.log("req.user", req.user);
  next();
};

export default firebaseAuthMiddleware;
