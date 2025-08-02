import multer from "multer";
import path from "path";

// ✅ Memory storage for Cloudinary
const storage = multer.memoryStorage();

// ✅ Filter for image, audio, and video files
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedExtensions = [
    ".jpg", ".jpeg", ".png",        // images
    ".mp3", ".wav", ".m4a", ".ogg", // audio
    ".mp4", ".mov", ".avi", ".mkv", ".webm" // video
  ];

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error("Only image, audio, and video files are allowed"), false);
  }

  cb(null, true);
};

// ✅ Limit size to 100MB (100 * 1024 * 1024 bytes)
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// ✅ Accept multiple fields: image, audio, video (all optional)
export default upload.fields([
  { name: "image", maxCount: 1 },
  { name: "audio", maxCount: 1 },
  { name: "video", maxCount: 1 },
]);
