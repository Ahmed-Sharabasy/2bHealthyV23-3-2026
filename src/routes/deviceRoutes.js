import { Router } from "express";
import deviceController from "../controllers/deviceController.js";
import {
  registerDeviceValidator,
  updateDeviceValidator,
} from "../validators/deviceValidator.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

const router = Router();

// ── All routes are protected ────────────────────────────────
router.use(authMiddleware);

router.post(
  "/",
  registerDeviceValidator,
  validateRequest,
  deviceController.registerDevice,
);
router.get("/", deviceController.getDevices);
router.patch(
  "/:id",
  updateDeviceValidator,
  validateRequest,
  deviceController.updateDevice,
);
router.delete("/:id", deviceController.removeDevice);

export default router;
