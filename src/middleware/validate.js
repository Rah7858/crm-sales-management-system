const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const validatedData = schema.parse(req[source]);
    req[source] = validatedData;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validate;
