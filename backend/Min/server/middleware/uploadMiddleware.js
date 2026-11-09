const multer = require('multer');
const AppError = require('../utils/appError');
const {
  UPLOAD_DIR,
  ALLOWED_FILE_TYPES,
  ensureUploadDir,
  getExtension,
  generateStoredName,
} = require('../utils/fileHelpers');

ensureUploadDir();

const maxSizeMb = Number(process.env.MAX_FILE_SIZE_MB) > 0 ? Number(process.env.MAX_FILE_SIZE_MB) : 20;

// Local disk storage with a unique generated file name
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, generateStoredName(file.originalname)),
});

// Validate both the extension and the MIME type
const fileFilter = (req, file, cb) => {
  const ext = getExtension(file.originalname);
  const allowedMimes = ALLOWED_FILE_TYPES[ext];
  if (!allowedMimes) {
    return cb(
      new AppError(
        `Unsupported file format ".${ext}". Allowed: ${Object.keys(ALLOWED_FILE_TYPES).join(', ')}`,
        400
      )
    );
  }
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new AppError(`File type "${file.mimetype}" does not match the .${ext} extension`, 400));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMb * 1024 * 1024, files: 1 },
});

// Expects the file in the multipart/form-data field named "file"
const uploadSingle = upload.single('file');

module.exports = { uploadSingle, maxSizeMb };
