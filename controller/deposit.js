const asyncHandler = require('express-async-handler');
const Deposit = require('../models/Deposit');
const User = require('../models/User');
const { successReturn, errorReturn } = require('../helpers/CustomReturn');
const getDepositAddress = asyncHandler(async (req, res, next) => {
  const { user } = req;
  try {
    const deposits = await Deposit.find({ userId: user._id }).select('-userId');
    return successReturn(res, { deposits });
  } catch (error) {
    return errorReturn(res, {
      error: error || error.message,
    });
  }
});
const createDepositAddress = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const body = { ...req.body, userId: user._id };
  try {
    const create = await Deposit.create(body);
    const owner = await User.findOne({ _id: user._id });
    owner.usdtBalance += body.usdt;
    await owner.save();
    return successReturn(res, { deposit: create });
  } catch (error) {
    console.log(error);
    return errorReturn(res, {
      error: error || error.message,
    });
  }
});
const buyDepositAddress = asyncHandler(async (req, res, next) => {
  const { usdt, ggcPrice } = req.body;
  const { user } = req;
  try {
    const numberController =
      Number(usdt)===usdt && Number(ggcPrice)===ggcPrice&&(usdt&&ggcPrice);
      if(!numberController)
      return errorReturn(res, { message: 'usdt and ggcPrice cannot be empty' });
   
    
    let ownerUser = await User.findOne({ _id: user._id });
    if (ownerUser.usdtBalance < usdt) {
      return errorReturn(res, { message: 'insufficient balance' });
    }
    ownerUser.usdtBalance -= usdt;
    ownerUser.tokenBalance += usdt * ggcPrice;
    await ownerUser.save();
    return successReturn(res, {});
  } catch (error) {
    return errorReturn(res, {
      error: error || error.message,
    });
  }
});

module.exports = {
  createDepositAddress,
  getDepositAddress,
  buyDepositAddress,
};
