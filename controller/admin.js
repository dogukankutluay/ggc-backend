const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { successReturn, errorReturn } = require('../helpers/CustomReturn');
const { createQueryObjects } = require('../helpers/general');
const getUsers = asyncHandler(async (req, res, next) => {
  try {
    const qO = createQueryObjects(req.body, { role: 'User' });
    const users = await User.find(qO).select('-password -registerAccess');
    return successReturn(res, { users });
  } catch (error) {
    return errorReturn(res, {
      error: error || error.message,
    });
  }
});
const userAssignPrice = asyncHandler(async (req, res, next) => {
  const { walletNo, usdt } = req.body;
  try {
    const user = await User.findOne({ walletNo });
    if (!user) return errorReturn(res, { message: 'not found user' });
    user.usdtBalance += usdt;
    await user.save();
    return successReturn(res);
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
  userAssignPrice,
};
