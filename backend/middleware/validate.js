const validate = (schema, target = 'body') => (req, res, next) => {
  try {
    const dataToValidate = target === 'body' ? req.body : target === 'params' ? req.params : req.query;
    const parsed = schema.parse(dataToValidate);
    if (target === 'body') req.body = parsed;
    next();
  } catch (err) {
    if (err.name === 'ZodError' || err.issues) {
      const details = (err.issues || err.errors).map((e) => ({
        field: e.path.join('.'),
        message: e.message
      }));

      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request payload',
          details
        }
      });
    }

    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message || 'Validation failed'
      }
    });
  }
};

module.exports = validate;
