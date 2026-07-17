module.exports = schema => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (result.success) {
    req.body = result.data;
    return next();
  }
  const error = new Error(result.error.issues[0]?.message || 'Invalid request');
  error.status = 400;
  error.code = 'VALIDATION_ERROR';
  next(error);
};
