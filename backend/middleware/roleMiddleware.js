const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error('Forbidden: insufficient permissions'));
    }

    return next();
  };
};

const blockSuperAdminMutation = (req, res, next) => {
  if (req.user?.role !== 'super_admin' && req.body?.role === 'super_admin') {
    res.status(403);
    return next(new Error('Only Super Admin can assign the super_admin role'));
  }

  return next();
};

module.exports = { authorize, blockSuperAdminMutation };
