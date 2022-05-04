const asyncHandler = require('express-async-handler');
const { generateAccount } = require('tron-create-address');
const axios = require('axios');
const dotenv = require('dotenv');
const Deposit = require('../models/Deposit');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Log = require('../models/Log');
const { successReturn, errorReturn } = require('../helpers/CustomReturn');

dotenv.config({
  path: './config/env/config.env',
});

const BASE_URL = process.env.TRON_URL;

const getDepositAddress = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { param } = req.params;

  try {
    if (param === 'log') {
      const logs = await Log.find({ userId: user._id }).select('-userId');
      return successReturn(res, { logs });
    }
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
    //create new account
    const { address, privateKey } = generateAccount();
    const owner = await User.findOne({ _id: user._id });

    //users can only have one account
    const deposit = await Deposit.findOne({ userId: user._id });
    if (deposit) {
      errorReturn(res, { error: 'Address already exist' });
    } else {
      const create = await Deposit.create({
        ...body,
        address: address,
        privateKey: privateKey,
        usdt: owner.usdtBalance,
      });

      return successReturn(res, { deposit: create });
    }
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
      Number(usdt) === usdt &&
      Number(ggcPrice) === ggcPrice &&
      usdt &&
      ggcPrice;
    if (!numberController)
      return errorReturn(res, { message: 'usdt and ggcPrice cannot be empty' });

    let ownerUser = await User.findOne({ _id: user._id });
    if (ownerUser.usdtBalance < usdt) {
      return errorReturn(res, { message: 'insufficient balance' });
    }

    ownerUser.usdtBalance -= usdt;
    ownerUser.tokenBalance += usdt / ggcPrice;

    await ownerUser.save();

    await Log.create({
      userId: user._id,
      usdt,
      ggc: usdt / ggcPrice,
      ggcPrice,
    });

    return successReturn(res, {});
  } catch (error) {
    return errorReturn(res, {
      error: error || error.message,
    });
  }
});

const checkDepositAdress = asyncHandler(async (req, res, next) => {
  const {
    user: { _id },
  } = req;
  //helper func
  function numberWithCommas(x) {
    return parseFloat(x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
  }

  try {
    const deposits = await Deposit.find({ userId: _id }).select('-userId');

    //address control with tronscan
    const { data } = await axios.get(`${BASE_URL}${deposits[0]?.address}`);
    if (data?.total > 1) {
      const owner = await User.findById({ _id });
      const payment = await Payment.findOne({ userId: _id });
      const initialValue = owner.usdtBalance;

      //if payment alreay exist
      if (!!payment) {
        //filter unverified payment
        const unverifiedPayment = data.data.filter(
          (token, i) => token.tokenId !== payment.verified_payment[i]?.tokenId
        );

        //reduce unverified payment + user usdtBalance
        const total = unverifiedPayment.reduce(
          (previousValue, currentValue) =>
            previousValue + numberWithCommas(currentValue?.balance),
          initialValue
        );
        //add total user usdt balance
        owner.usdtBalance = total;
        await owner.save();

        //update payments
        payment.verified_payment = data.data;
        await payment.save();

        return successReturn(res, {});
      } else {
        //if payment doesnt exist
        await Payment.create({
          userId: _id,
          verified_payment: data.data,
        });

        const total = data.data.reduce(
          (previousValue, currentValue) =>
            previousValue + numberWithCommas(currentValue?.balance),
          initialValue
        );

        owner.usdtBalance = total;
        await owner.save();

        return successReturn(res, {});
      }
    }
  } catch (err) {
    console.log(err);
  }
});

module.exports = {
  createDepositAddress,
  getDepositAddress,
  buyDepositAddress,
  checkDepositAdress,
};
