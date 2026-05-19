const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not found - ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  if (err.code === 11000) {
    statusCode = 409;
    const keys = Object.keys(err.keyPattern || err.keyValue || {});
    const isAppointmentSlotDup = keys.includes('doctor') && keys.includes('date') && keys.includes('time');
    if (isAppointmentSlotDup) {
      message = 'Bu vaqt band';
    } else {
      const field = Object.keys(err.keyValue || {})[0] || 'field';
      message = `${field} already exists`;
    }
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((item) => item.message).join(', ');
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

module.exports = { notFound, errorHandler };
