const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error('Forbidden: insufficient permissions'));
    }

    return next();
  };
};

module.exports = { authorize };
