const { errorReturn } = require('../helpers/CustomReturn');
const globalValidateBody = schema => async (req, res, next) => {
  try {
    await schema.validate(req.body);
    next();
  } catch (err) {
    return errorReturn(res, { type: err.name, message: err.message });
  }
};
const globalValidateQuery = schema => async (req, res, next) => {
  try {
    await schema.validate(req.query);
    next();
  } catch (err) {
    return errorReturn(res, { type: err.name, message: err.message });
  }
};
module.exports = {
  globalValidateBody,
  globalValidateQuery,
};
