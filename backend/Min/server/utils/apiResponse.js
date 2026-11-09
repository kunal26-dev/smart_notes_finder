// Consistent success response: { success, message, data }
const sendSuccess = (res, statusCode, message, data) => {
  const body = { success: true, message };
  if (data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess };
