import { validationResult } from "express-validator";
import Device from "../models/Device.js";
import AppError from "../utils/AppError.js";

// ═════════════════════════════════════════════════════════════
// REGISTER DEVICE
// ═════════════════════════════════════════════════════════════
const registerDevice = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { deviceUUID, model, firmware } = req.body;

    // Check if device already registered
    const existingDevice = await Device.findOne({ deviceUUID });
    if (existingDevice) {
      // If already registered to this user, update it
      if (existingDevice.user.toString() === req.user._id.toString()) {
        existingDevice.model = model || existingDevice.model;
        existingDevice.firmware = firmware || existingDevice.firmware;
        existingDevice.lastSeen = new Date();
        existingDevice.isConnected = true;
        await existingDevice.save();

        return res.status(200).json({
          status: "success",
          message: "Device updated",
          data: { device: existingDevice },
        });
      }
      return next(
        new AppError("Device is already registered to another user", 400),
      );
    }

    const device = await Device.create({
      user: req.user._id,
      deviceUUID,
      model,
      firmware,
      lastSeen: new Date(),
      isConnected: true,
    });

    res.status(201).json({
      status: "success",
      data: { device },
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════
// GET USER DEVICES
// ═════════════════════════════════════════════════════════════
const getDevices = async (req, res, next) => {
  try {
    const devices = await Device.find({ user: req.user._id }).sort({
      lastSeen: -1,
    });

    res.status(200).json({
      status: "success",
      results: devices.length,
      data: { devices },
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════
// UPDATE DEVICE
// ═════════════════════════════════════════════════════════════
const updateDevice = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const device = await Device.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { ...req.body, lastSeen: new Date() },
      { new: true, runValidators: true },
    );

    if (!device) {
      return next(new AppError("Device not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: { device },
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════
// REMOVE DEVICE
// ═════════════════════════════════════════════════════════════
const removeDevice = async (req, res, next) => {
  try {
    const device = await Device.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!device) {
      return next(new AppError("Device not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Device removed successfully",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  registerDevice,
  getDevices,
  updateDevice,
  removeDevice,
};
