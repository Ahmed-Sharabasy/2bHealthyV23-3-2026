import multer from "multer";
import AppError from "../utils/AppError.js";
import sharp from "sharp";
import path from "path";
import fs from "fs";

// ── Storage config — saves to /uploads/<fieldname>/ ─────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// ── File filter — images only ───────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extOk = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimeOk = allowedTypes.test(file.mimetype);

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(
      new AppError("Only image files (jpeg, jpg, png, webp) are allowed.", 400),
      false,
    );
  }
};

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
// });

// ahmed version
// save photo into memory to manipulate it before saving to disk
const multerStorageMemory = multer.memoryStorage();

// define multer filter
const multerFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extOk = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimeOk = allowedTypes.test(file.mimetype);
  // if (file.mimetype.startsWith("image") )
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    // this will based to multerStorage.filename cb function
    cb(
      new AppError("Only image files (jpeg, jpg, png, webp) are allowed.", 400),
      false,
    );
  }
};

// const upload = multer({ dest: "public/img" });
const upload = multer({
  // storage: multerStorage,
  storage: multerStorageMemory,
  fileFilter: multerFilter,
});

export const uploadRowUserAvatar = upload.single("photo");

// export const resizeUserPhoto = async (req, res, next) => {
//   if (!req.file) return next();

//   // generate filename
//   const filename = `user-${req.user._id}-${Date.now()}.jpeg`;

//   req.file.filename = filename;

//   await sharp(req.file.buffer)
//     .resize(500, 500)
//     .toFormat("jpeg")
//     .jpeg({ quality: 90 })
//     .toFile(`../public/img/${filename}`);

//   next();
// };

// export default upload;

export const resizeUserPhoto = async (req, res, next) => {
  if (!req.file) return next();

  // absolute path للمجلد
  const uploadDir = path.join(process.cwd(), "public", "img");

  // لو مش موجود فولدر، اعمله
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `user-${req.user._id}-${Date.now()}.jpeg`;
  req.file.filename = filename;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(path.join(uploadDir, filename));

  next();
};
