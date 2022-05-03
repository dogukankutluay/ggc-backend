const asyncHandler = require("express-async-handler");
const Payment = require("../models/Payment");
const { successReturn, errorReturn } = require("../helpers/CustomReturn");

const getPaymentAddress = asyncHandler(async (req, res, next) => {
  const { user } = req;
  try {
    const payment = await Payment.find({ userId: user._id });
    return successReturn(res, { payment });
  } catch (error) {
    return errorReturn(res, {
      error: error || error.message,
    });
  }
});

module.exports = {
  getPaymentAddress,
};
