const Category = require('../models/Category');
const Resource = require('../models/Resource');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { isString } = require('../utils/validators');

const validateCategory = (body, partial = false) => {
  const errors = [];
  const values = {};
  const provided = (k) => body[k] !== undefined;

  if (!partial || provided('categoryName')) {
    if (!isString(body.categoryName) || body.categoryName.trim().length < 2) {
      errors.push('Category name is required (min 2 characters)');
    } else values.categoryName = body.categoryName.trim();
  }
  if (provided('description')) {
    if (!isString(body.description)) errors.push('Description must be text');
    else values.description = body.description;
  }
  return { errors, values };
};

// POST /api/categories  (admin)
const createCategory = asyncHandler(async (req, res) => {
  const { errors, values } = validateCategory(req.body);
  if (errors.length) throw new AppError('Validation failed', 400, errors);
  const category = await Category.create(values);
  sendSuccess(res, 201, 'Category created successfully', { category });
});

// GET /api/categories  (any logged-in user)
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ categoryName: 1 });
  sendSuccess(res, 200, 'Categories retrieved successfully', { count: categories.length, categories });
});

// GET /api/categories/:id
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  sendSuccess(res, 200, 'Category retrieved successfully', { category });
});

// PUT/PATCH /api/categories/:id  (admin)
const updateCategory = asyncHandler(async (req, res) => {
  const { errors, values } = validateCategory(req.body, true);
  if (errors.length) throw new AppError('Validation failed', 400, errors);
  if (Object.keys(values).length === 0) throw new AppError('No valid fields to update', 400);

  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  Object.assign(category, values);
  await category.save();
  sendSuccess(res, 200, 'Category updated successfully', { category });
});

// DELETE /api/categories/:id  (admin; blocked while resources use it)
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  const inUse = await Resource.countDocuments({ category: category._id });
  if (inUse > 0) {
    throw new AppError(`Cannot delete this category: ${inUse} resource(s) are using it`, 409);
  }
  await category.deleteOne();
  sendSuccess(res, 200, 'Category deleted successfully');
});

module.exports = { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory };
