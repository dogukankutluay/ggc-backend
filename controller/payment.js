const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');
const { successReturn, errorReturn } = require('../helpers/CustomReturn');

const getPaymentAddress = asyncHandler(async (req, res, next) => {
  const { user } = req;
  try {
    const payment = await Payment.find({ userId: user._id });
    let result = payment.map((pay, i) => {
      if (pay.coinName == 'trc') {
        pay.verified_payment = pay.verified_payment.filter(
          ver => ver.tokenId != '_'
        );
      }
      return pay;
    });
    return successReturn(res, { payment: result });
  } catch (error) {
    return errorReturn(res, {
      error: error || error.message,
    });
  }
});

module.exports = {
  getPaymentAddress,
};
