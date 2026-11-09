const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const AppError = require('./appError');

// All uploaded files live in <project>/uploads. To move to cloud storage later,
// only this file and middleware/uploadMiddleware.js need to change.
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Allowed extension -> accepted MIME types
const ALLOWED_FILE_TYPES = {
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ppt: ['application/vnd.ms-powerpoint'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  txt: ['text/plain'],
  csv: ['text/csv', 'application/csv', 'application/vnd.ms-excel'],
  zip: ['application/zip', 'application/x-zip-compressed'],
};

const ensureUploadDir = () => {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
};

const getExtension = (fileName = '') => path.extname(fileName).replace('.', '').toLowerCase();

// Unique, unguessable stored name; the user-supplied name is never used on disk
const generateStoredName = (originalName) => {
  const ext = getExtension(originalName);
  const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  return ext ? `${unique}.${ext}` : unique;
};

// Resolves a stored file name to an absolute path and blocks path traversal
const resolveUploadPath = (storedFileName) => {
  if (typeof storedFileName !== 'string' || !storedFileName) {
    throw new AppError('Invalid file reference', 400);
  }
  // Generated names only contain letters, digits, dots, dashes and underscores
  const safeName = path.basename(storedFileName);
  const fullPath = path.resolve(UPLOAD_DIR, safeName);
  if (
    !/^[A-Za-z0-9._-]+$/.test(storedFileName) ||
    storedFileName.includes('..') ||
    safeName !== storedFileName ||
    !fullPath.startsWith(UPLOAD_DIR + path.sep)
  ) {
    throw new AppError('Invalid file path', 400);
  }
  return fullPath;
};

const fileExists = async (fullPath) => {
  try {
    await fs.promises.access(fullPath, fs.constants.R_OK);
    return true;
  } catch (e) {
    return false;
  }
};

// Never throws: a missing file must not block deleting the database record
const deleteStoredFile = async (storedFileName) => {
  try {
    await fs.promises.unlink(resolveUploadPath(storedFileName));
  } catch (e) {
    if (e.code !== 'ENOENT') console.error(`Could not delete file ${storedFileName}: ${e.message}`);
  }
};

module.exports = {
  UPLOAD_DIR,
  ALLOWED_FILE_TYPES,
  ensureUploadDir,
  getExtension,
  generateStoredName,
  resolveUploadPath,
  fileExists,
  deleteStoredFile,
};
