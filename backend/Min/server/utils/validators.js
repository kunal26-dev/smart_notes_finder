const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const isValidObjectId = (value) => typeof value === 'string' && OBJECT_ID_REGEX.test(value);
const isValidEmail = (value) => typeof value === 'string' && EMAIL_REGEX.test(value.trim());
const isString = (value) => typeof value === 'string';

// Escape user input before putting it inside a RegExp (prevents regex injection)
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Accepts an array, a JSON array string or a comma separated string.
// Returns a clean array of unique lowercase tags, or null when the input is not usable.
const parseTags = (input) => {
  if (input === undefined || input === null || input === '') return [];
  let list = input;
  if (typeof list === 'string') {
    const trimmed = list.trim();
    if (trimmed.startsWith('[')) {
      try {
        list = JSON.parse(trimmed);
      } catch (e) {
        return null;
      }
    } else {
      list = trimmed.split(',');
    }
  }
  if (!Array.isArray(list)) return null;
  if (!list.every((t) => typeof t === 'string')) return null;
  const cleaned = list.map((t) => t.trim().toLowerCase()).filter(Boolean);
  return [...new Set(cleaned)];
};

const parsePagination = (query) => {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);
  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(limit) || limit < 1) limit = 10;
  if (limit > 50) limit = 50;
  return { page, limit, skip: (page - 1) * limit };
};

const buildPagination = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1;
  return { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 };
};

module.exports = {
  isValidObjectId,
  isValidEmail,
  isString,
  escapeRegex,
  parseTags,
  parsePagination,
  buildPagination,
};
