const Subject = require('../models/Subject');
const Resource = require('../models/Resource');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { isString, escapeRegex } = require('../utils/validators');

const validateSubject = (body, partial = false) => {
  const errors = [];
  const values = {};
  const provided = (k) => body[k] !== undefined;

  if (!partial || provided('subjectName')) {
    if (!isString(body.subjectName) || body.subjectName.trim().length < 2) {
      errors.push('Subject name is required (min 2 characters)');
    } else values.subjectName = body.subjectName.trim();
  }
  if (!partial || provided('subjectCode')) {
    if (!isString(body.subjectCode) || !body.subjectCode.trim() || body.subjectCode.trim().length > 20) {
      errors.push('Subject code is required (max 20 characters)');
    } else values.subjectCode = body.subjectCode.trim();
  }
  if (provided('description')) {
    if (!isString(body.description)) errors.push('Description must be text');
    else values.description = body.description;
  }
  return { errors, values };
};

// POST /api/subjects  (admin)
const createSubject = asyncHandler(async (req, res) => {
  const { errors, values } = validateSubject(req.body);
  if (errors.length) throw new AppError('Validation failed', 400, errors);
  const subject = await Subject.create(values);
  sendSuccess(res, 201, 'Subject created successfully', { subject });
});

// GET /api/subjects  (any logged-in user; optional ?search=)
const getSubjects = asyncHandler(async (req, res) => {
  const filter = {};
  if (isString(req.query.search) && req.query.search.trim()) {
    const regex = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    filter.$or = [{ subjectName: regex }, { subjectCode: regex }];
  }
  const subjects = await Subject.find(filter).sort({ subjectName: 1 });
  sendSuccess(res, 200, 'Subjects retrieved successfully', { count: subjects.length, subjects });
});

// GET /api/subjects/:id
const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) throw new AppError('Subject not found', 404);
  sendSuccess(res, 200, 'Subject retrieved successfully', { subject });
});

// PUT/PATCH /api/subjects/:id  (admin)
const updateSubject = asyncHandler(async (req, res) => {
  const { errors, values } = validateSubject(req.body, true);
  if (errors.length) throw new AppError('Validation failed', 400, errors);
  if (Object.keys(values).length === 0) throw new AppError('No valid fields to update', 400);

  const subject = await Subject.findById(req.params.id);
  if (!subject) throw new AppError('Subject not found', 404);
  Object.assign(subject, values);
  await subject.save();
  sendSuccess(res, 200, 'Subject updated successfully', { subject });
});

// DELETE /api/subjects/:id  (admin; blocked while resources use it)
const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) throw new AppError('Subject not found', 404);

  const inUse = await Resource.countDocuments({ subject: subject._id });
  if (inUse > 0) {
    throw new AppError(`Cannot delete this subject: ${inUse} resource(s) are using it`, 409);
  }
  await subject.deleteOne();
  sendSuccess(res, 200, 'Subject deleted successfully');
});

module.exports = { createSubject, getSubjects, getSubjectById, updateSubject, deleteSubject };
