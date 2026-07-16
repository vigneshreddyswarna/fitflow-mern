const jwt = require('jsonwebtoken');

module.exports = function auth(req, _res, next) {
  try {
    const token = req.cookies?.fitflow_session || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('Please sign in to continue');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    require('../models/User').findById(decoded.id).select('name role isEmailVerified demoAccount').lean().then(user => {
      if (!user) throw new Error('Account no longer exists');
      req.user = { id: String(user._id), name: user.name, role: user.role, isEmailVerified: user.isEmailVerified, demoAccount: user.demoAccount };
      next();
    }).catch(error => { error.status = 401; next(error); });
  } catch (error) {
    error.status = 401;
    next(error);
  }
};

module.exports.requireVerified = function requireVerified(req, _res, next) {
  if (!req.user?.isEmailVerified) {
    const error = new Error('Please verify your email to continue');
    error.status = 403;
    return next(error);
  }
  next();
};
