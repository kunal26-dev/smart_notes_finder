const Resource = require('../models/Resource');
const Subject = require('../models/Subject');
const AppError = require('./appError');
const { isValidObjectId, escapeRegex, parsePagination, buildPagination } = require('./validators');

// Fields populated on every resource response (admins also see the uploader's email)
const populateOptions = (isAdmin = false) => [
  { path: 'subject', select: 'subjectName subjectCode' },
  { path: 'category', select: 'categoryName' },
  { path: 'uploadedBy', select: isAdmin ? 'name email role' : 'name role' },
];

// Normalises ?status= (case-insensitive). Returns undefined for empty/"all".
const parseStatus = (value) => {
  if (value === undefined || value === '' || value === null) return undefined;
  if (typeof value !== 'string') throw new AppError('Invalid status filter', 400);
  if (value.toLowerCase() === 'all') return undefined;
  const match = Resource.STATUSES.find((s) => s.toLowerCase() === value.toLowerCase());
  if (!match) throw new AppError(`Invalid status. Use one of: ${Resource.STATUSES.join(', ')}, all`, 400);
  return match;
};

const objectIdFilter = (value, label) => {
  if (typeof value !== 'string' || !isValidObjectId(value)) {
    throw new AppError(`Invalid ${label} id`, 400);
  }
  return value;
};

// Builds a MongoDB filter from query-string params. All filters combine with AND.
//   search | keyword | q : words matched (partial, case-insensitive) against
//                          title, description, tags and subject name/code
//   subject, category    : ObjectId
//   semester             : 1-12
//   fileType | format    : e.g. pdf, docx
const buildResourceFilter = async (query, baseFilter = {}) => {
  const filter = { ...baseFilter };

  if (query.subject) filter.subject = objectIdFilter(query.subject, 'subject');
  if (query.category) filter.category = objectIdFilter(query.category, 'category');

  if (query.semester !== undefined && query.semester !== '') {
    const semester = Number(query.semester);
    if (typeof query.semester !== 'string' || !Number.isInteger(semester) || semester < 1 || semester > 12) {
      throw new AppError('Semester must be a number between 1 and 12', 400);
    }
    filter.semester = semester;
  }

  const fileType = query.fileType || query.format;
  if (fileType) {
    if (typeof fileType !== 'string') throw new AppError('Invalid file type filter', 400);
    filter.fileType = fileType.toLowerCase().replace('.', '').trim();
  }

  const keywordRaw = query.search || query.keyword || query.q;
  if (keywordRaw) {
    if (typeof keywordRaw !== 'string') throw new AppError('Invalid search keyword', 400);
    const terms = keywordRaw.trim().split(/\s+/).filter(Boolean).slice(0, 6);
    const and = [];
    for (const term of terms) {
      const regex = new RegExp(escapeRegex(term), 'i');
      const subjectIds = await Subject.find({
        $or: [{ subjectName: regex }, { subjectCode: regex }],
      }).distinct('_id');
      and.push({
        $or: [{ title: regex }, { description: regex }, { tags: regex }, { subject: { $in: subjectIds } }],
      });
    }
    if (and.length) filter.$and = and;
  }

  return filter;
};

const getSort = (query) =>
  query.sort === 'oldest' || query.order === 'asc' ? { createdAt: 1, _id: 1 } : { createdAt: -1, _id: -1 };

// Runs the search/filter/sort/pagination pipeline shared by user and admin endpoints
const findResources = async (query, baseFilter, isAdmin = false) => {
  const filter = await buildResourceFilter(query, baseFilter);
  const { page, limit, skip } = parsePagination(query);

  const [resources, total] = await Promise.all([
    Resource.find(filter).sort(getSort(query)).skip(skip).limit(limit).populate(populateOptions(isAdmin)),
    Resource.countDocuments(filter),
  ]);

  return { resources, pagination: buildPagination(total, page, limit) };
};

module.exports = { populateOptions, parseStatus, buildResourceFilter, getSort, findResources };
