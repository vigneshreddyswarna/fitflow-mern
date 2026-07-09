module.exports = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    const error = new Error('You do not have permission to perform this action');
    error.status = 403;
    return next(error);
  }
  next();
};
