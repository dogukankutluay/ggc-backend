const asyncHandler = require('express-async-handler');
const { generateAccount } = require('tron-create-address');
const axios = require('axios');
const dotenv = require('dotenv');
const Deposit = require('../models/Deposit');
const DepositBnb = require('../models/BNB/DepositBnb');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Log = require('../models/Log');
const Web3 = require('web3');

const { successReturn, errorReturn } = require('../helpers/CustomReturn');

dotenv.config({
  path: './config/env/config.env',
});

const BASE_URL = process.env.TRON_URL;

const getDepositAddress = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { param } = req.params;
  try {
    if (param && param === 'log') {
      const logs = await Log.find({ userId: user._id }).select('-userId');
      return successReturn(res, { logs });
    }

    const trcs = await Deposit.find({ userId: user._id }).select('-userId');
    const bnbs = await DepositBnb.find({ userId: user._id }).select('-userId');
    return successReturn(res, { deposits: { trcs, bnbs } });
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
    if (!body.coinName) return errorReturn(res, {});

    switch (body.coinName) {
      case 'trc':
        const { address, privateKey } = generateAccount();
        const owner = await User.findOne({ _id: user._id });
        const deposit = await Deposit.findOne({
          userId: user._id,
        });
        if (deposit) {
          errorReturn(res, { error: 'Address already exist' });
        } else {
          const create = await Deposit.create({
            ...body,
            address: address,
            privateKey: privateKey,
            usdt: owner.usdtBalance,
            role: body.role,
          });

          return successReturn(res, { deposit: create });
        }
      case 'bnb':
        {
          const web3 = new Web3(
            'https://data-seed-prebsc-1-s1.binance.org:8545'
          );
          const { address, privateKey } = web3.eth.accounts.create();
          const owner = await User.findOne({ _id: user._id });
          const deposit = await DepositBnb.findOne({
            userId: user._id,
          });
          if (deposit) {
            errorReturn(res, { error: 'Address already exist' });
          } else {
            const create = await DepositBnb.create({
              ...body,
              address: address,
              privateKey: privateKey,
              usdt: owner.usdtBalance,
            });

            return successReturn(res, { deposit: create });
          }
        }
        break;

      default:
        break;
    }
  } catch (error) {
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
    if (!req.query.coinName) return errorReturn(res, {});

    const deposits = await Deposit.find({ userId: _id }).select('-userId');

    //address control with tronscan
    const { data } = await axios.get(`${BASE_URL}${deposits[0]?.address}`);
    // require('axios')
    //   .get(
    //     'https://api.bscscan.com/api?module=account&action=txlist&address=0xc83CBa50957365db810dC7C6E80646201F624878&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=M9J7Z2RPPGURTWV5A91GASSZ6CXT3EMMR3'
    //   )
    //   .then(a => console.log(a.data.result.map(d => numberWithCommas(d.value))));
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
    } else return successReturn(res, {});
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
