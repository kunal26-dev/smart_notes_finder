const Resource = require('../models/Resource');
const Subject = require('../models/Subject');
const Category = require('../models/Category');
const Bookmark = require('../models/Bookmark');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { isValidObjectId, parseTags } = require('../utils/validators');
const {
  resolveUploadPath,
  fileExists,
  deleteStoredFile,
  getExtension,
} = require('../utils/fileHelpers');
const { populateOptions, parseStatus, findResources } = require('../utils/resourceQuery');
const path = require('path');

const isAdmin = (user) => user.role === 'Admin';
const isOwner = (user, resource) => String(resource.uploadedBy._id || resource.uploadedBy) === String(user._id);

// Approved resources are visible to everyone logged in; others only to the owner or an admin
const canView = (user, resource) => resource.status === 'Approved' || isOwner(user, resource) || isAdmin(user);

// Owner or admin may modify. Hides pending/rejected resources from other users (404 instead of 403).
const assertCanModify = (user, resource) => {
  if (isOwner(user, resource) || isAdmin(user)) return;
  throw new AppError(
    resource.status === 'Approved' ? 'You can only modify your own resources' : 'Resource not found',
    resource.status === 'Approved' ? 403 : 404
  );
};

// Validates the editable fields. With partial=true only provided fields are checked.
const validateResourceInput = (body, partial = false) => {
  const errors = [];
  const values = {};
  const provided = (key) => body[key] !== undefined;

  if (!partial || provided('title')) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (title.length < 3 || title.length > 150) errors.push('Title is required (3-150 characters)');
    else values.title = title;
  }
  if (!partial || provided('description')) {
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    if (!description || description.length > 2000) errors.push('Description is required (max 2000 characters)');
    else values.description = description;
  }
  if (!partial || provided('subject')) {
    if (!isValidObjectId(body.subject)) errors.push('A valid subject id is required');
    else values.subject = body.subject;
  }
  if (!partial || provided('category')) {
    if (!isValidObjectId(body.category)) errors.push('A valid category id is required');
    else values.category = body.category;
  }
  if (!partial || provided('semester')) {
    const semester = typeof body.semester === 'string' || typeof body.semester === 'number' ? Number(body.semester) : NaN;
    if (body.semester === '' || !Number.isInteger(semester) || semester < 1 || semester > 12) {
      errors.push('Semester is required (a whole number from 1 to 12)');
    } else values.semester = semester;
  }
  if (provided('tags')) {
    const tags = parseTags(body.tags);
    if (tags === null) errors.push('Tags must be a comma separated string or an array of strings');
    else if (tags.length > 15) errors.push('A resource can have at most 15 tags');
    else if (tags.some((t) => t.length > 30)) errors.push('Each tag can be at most 30 characters');
    else values.tags = tags;
  }

  return { errors, values };
};

const assertSubjectAndCategoryExist = async (values) => {
  if (values.subject && !(await Subject.exists({ _id: values.subject }))) {
    throw new AppError('Subject not found', 400);
  }
  if (values.category && !(await Category.exists({ _id: values.category }))) {
    throw new AppError('Category not found', 400);
  }
};

// Removes the DB record, related bookmarks and the stored file
const removeResource = async (resource) => {
  await Bookmark.deleteMany({ resource: resource._id });
  await resource.deleteOne();
  await deleteStoredFile(resource.storedFileName);
};

// POST /api/resources  (multipart/form-data, file field name: "file")
const uploadResource = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    throw new AppError('A file is required. Send multipart/form-data with the file in the "file" field.', 400);
  }

  try {
    const { errors, values } = validateResourceInput(req.body, false);
    if (errors.length) throw new AppError('Validation failed', 400, errors);
    await assertSubjectAndCategoryExist(values);

    const resource = await Resource.create({
      ...values,
      tags: values.tags || [],
      originalFileName: path.basename(file.originalname),
      storedFileName: file.filename,
      filePath: `uploads/${file.filename}`,
      fileType: getExtension(file.originalname),
      fileSize: file.size,
      uploadedBy: req.user._id,
      // Admin uploads are trusted; everything else waits for review
      status: isAdmin(req.user) ? 'Approved' : 'Pending',
    });

    await resource.populate(populateOptions(isAdmin(req.user)));

    sendSuccess(
      res,
      201,
      isAdmin(req.user)
        ? 'Resource uploaded successfully'
        : 'Resource uploaded successfully and is awaiting admin approval',
      { resource }
    );
  } catch (err) {
    // Do not leave orphan files when the request fails after the upload
    await deleteStoredFile(file.filename);
    throw err;
  }
});

// GET /api/resources  (approved only; supports search, filters, sort, pagination)
const getResources = asyncHandler(async (req, res) => {
  const data = await findResources(req.query, { status: 'Approved' }, false);
  sendSuccess(res, 200, 'Resources retrieved successfully', data);
});

// GET /api/resources/my  (the logged-in user's uploads, optional ?status=)
const getMyResources = asyncHandler(async (req, res) => {
  const base = { uploadedBy: req.user._id };
  const status = parseStatus(req.query.status);
  if (status) base.status = status;
  const data = await findResources(req.query, base, false);
  sendSuccess(res, 200, 'Your resources retrieved successfully', data);
});

// GET /api/resources/pending  (admin only)
const getPendingResources = asyncHandler(async (req, res) => {
  const data = await findResources(req.query, { status: 'Pending' }, true);
  sendSuccess(res, 200, 'Pending resources retrieved successfully', data);
});

// GET /api/resources/:id
const getResourceById = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id).populate(populateOptions(isAdmin(req.user)));
  if (!resource || !canView(req.user, resource)) throw new AppError('Resource not found', 404);
  sendSuccess(res, 200, 'Resource retrieved successfully', { resource });
});

// PUT/PATCH /api/resources/:id  (owner or admin; partial updates allowed)
const updateResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) throw new AppError('Resource not found', 404);
  assertCanModify(req.user, resource);

  const { errors, values } = validateResourceInput(req.body, true);
  if (errors.length) throw new AppError('Validation failed', 400, errors);
  if (Object.keys(values).length === 0) {
    throw new AppError('No valid fields to update. Allowed: title, description, subject, semester, category, tags', 400);
  }
  await assertSubjectAndCategoryExist(values);

  Object.assign(resource, values);

  // An edit by a non-admin sends the resource back for review
  if (!isAdmin(req.user) && resource.status !== 'Pending') {
    resource.status = 'Pending';
    resource.rejectionReason = undefined;
  }

  await resource.save();
  await resource.populate(populateOptions(isAdmin(req.user)));
  sendSuccess(res, 200, 'Resource updated successfully', { resource });
});

// DELETE /api/resources/:id  (owner or admin)
const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) throw new AppError('Resource not found', 404);
  assertCanModify(req.user, resource);

  await removeResource(resource);
  sendSuccess(res, 200, 'Resource deleted successfully');
});

// GET /api/resources/:id/download  (authenticated; approved, or own/admin)
const downloadResource = asyncHandler(async (req, res, next) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource || !canView(req.user, resource)) throw new AppError('Resource not found', 404);

  const fullPath = resolveUploadPath(resource.storedFileName); // blocks path traversal
  if (!(await fileExists(fullPath))) throw new AppError('File not found on the server', 404);

  res.download(fullPath, resource.originalFileName, (err) => {
    if (err && !res.headersSent) next(err);
  });
});

module.exports = {
  uploadResource,
  getResources,
  getMyResources,
  getPendingResources,
  getResourceById,
  updateResource,
  deleteResource,
  downloadResource,
  removeResource,
};
