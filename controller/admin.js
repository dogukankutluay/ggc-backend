const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { successReturn, errorReturn } = require('../helpers/CustomReturn');
const { createQueryObjects } = require('../helpers/general');
const getUsers = asyncHandler(async (req, res, next) => {
  const { q } = req.query;
  try {
    const qO = createQueryObjects(req.body, { role: 'User' });
    const users = await User.find(qO).select(
      'name surname email phone status createdAt'
    );
    return successReturn(res, { users });
  } catch (error) {
    return errorReturn(res, {
      error: error || error.message,
    });
  }
});
const userStatusAction = asyncHandler(async (req, res, next) => {
  const { status, _id } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      _id,
      { status },
      { new: true }
    ).select('name surname email phone status createdAt');
    if (!user) errorReturn(res, { message: 'not found user' });
    return successReturn(res, { user });
  } catch (error) {
    return errorReturn(res, {
      error: error || error.message,
    });
  }
});

module.exports = {
  getUsers,
  userStatusAction,
};
