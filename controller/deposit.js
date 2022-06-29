const asyncHandler = require("express-async-handler");
const { generateAccount } = require("tron-create-address");
const axios = require("axios");
const dotenv = require("dotenv");
const Deposit = require("../models/Deposit");
const DepositBnb = require("../models/BNB/DepositBnb");
const User = require("../models/User");
const Payment = require("../models/Payment");
const Log = require("../models/Log");
const Web3 = require("web3");
const TronWeb = require("tronweb");
const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = new HttpProvider("https://api.trongrid.io");
const solidityNode = new HttpProvider("https://api.trongrid.io");
const eventServer = new HttpProvider("https://api.trongrid.io");
const CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const TRCACCOUNT = "TVAitwKgT2M9EjiuSBtsMfZnaK2ZNohyja";
const BNBACCOUNT = "0xbf5a6ccc121f5150a2c7445ba5f12f9990d7bd84";

const { successReturn, errorReturn } = require("../helpers/CustomReturn");

dotenv.config({
  path: "./config/env/config.env",
});

const BASE_URL = process.env.TRON_URL;

const getDepositAddress = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { param } = req.params;
  try {
    if (param && param === "log") {
      const logs = await Log.find({ userId: user._id }).select("-userId");
      return successReturn(res, { logs });
    }

    let result = [];
    const trcs = await Deposit.findOne({ userId: user._id }).select("-userId");
    const bnbs = await DepositBnb.findOne({ userId: user._id }).select(
      "-userId"
    );

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
      case "trc":
        const { address, privateKey } = generateAccount();
        const owner = await User.findOne({ _id: user._id });
        const deposit = await Deposit.findOne({
          userId: user._id,
        });
        if (deposit) {
          return errorReturn(res, { error: "Address already exist" });
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
      case "bnb":
        {
          const web3 = new Web3(
            "https://data-seed-prebsc-1-s1.binance.org:8545"
          );
          const { address, privateKey } = web3.eth.accounts.create();
          const owner = await User.findOne({ _id: user._id });
          const deposit = await DepositBnb.findOne({
            userId: user._id,
          });
          if (deposit) {
            return errorReturn(res, { error: "Address already exist" });
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
        return errorReturn(res);
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
      return errorReturn(res, { message: "usdt and ggcPrice cannot be empty" });

    let ownerUser = await User.findOne({ _id: user._id });
    if (ownerUser.usdtBalance < usdt) {
      return errorReturn(res, { message: "insufficient balance" });
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
    return parseFloat(x?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."));
  }
  await User.findByIdAndUpdate(_id, { usdtBalance: 0 });
  try {
    {
      const deposits = await Deposit.find({ userId: _id }).select("-userId");

      const { data } = await axios.get(`${BASE_URL}${deposits[0]?.address}`);

      const tronWeb = new TronWeb(
        fullNode,
        solidityNode,
        eventServer,
        deposits[0]?.privateKey
      );

      async function transfer() {
        try {
          let contract = await tronWeb.contract().at(CONTRACT);

          const balance = await contract.methods
            .balanceOf(deposits[0]?.address)
            .call();
          console.log("balance usdt:", balance);

          Number(balance) > 0 &&
            (await contract
              .transfer(
                TRCACCOUNT, //address _to
                balance //amount
              )
              .send()
              .then((output) => {
                console.log("- Output:", output, "\n");
              }));
        } catch (err) {
          console.error(err);
          return null;
        }
      }
      transfer();

      if (data?.total > 1) {
        const owner = await User.findById({ _id });
        const payment = await Payment.findOne({ userId: _id, coinName: "trc" });
        const initialValue = owner.usdtBalance;

        if (!!payment) {
          const total = data.data.reduce(
            (previousValue, currentValue) =>
              currentValue.tokenName === "Tether USD" &&
              previousValue + numberWithCommas(currentValue?.balance),
            initialValue
          );

          owner.usdtBalance = total;
          await owner.save();
          payment.verified_payment = data.data;
          payment.coinName = "trc";
          await payment.save();
        } else {
          await Payment.create({
            userId: _id,
            verified_payment: data.data,
            coinName: "trc",
          });

          const total = data.data.reduce(
            (previousValue, currentValue) =>
              currentValue.tokenName === "Tether USD" &&
              previousValue + numberWithCommas(currentValue?.balance),
            initialValue
          );

          owner.usdtBalance = total;
          await owner.save();
        }
      }
    }

    {
      const depositsBnb = await DepositBnb.find({ userId: _id }).select(
        "-userId"
      );

      const web3 = new Web3("https://bsc-dataseed.binance.org");

      const balance = await web3.eth.getBalance(depositsBnb[0]?.address);

      const gasPrice = await web3.eth.estimateGas({
        from: depositsBnb[0]?.address,
        nonce: balance,
        to: BNBACCOUNT,
      });

      console.log("balance bnb: ", balance);
      console.log("Gas price:", gasPrice);

      const createTransaction =
        Number(balance) > 0 &&
        (await web3.eth.accounts.signTransaction(
          {
            from: depositsBnb[0]?.address,
            to: BNBACCOUNT,
            value: balance - 21000 * 50000000000,
            gas: 21000,
            gasPrice: 50000000000,
          },
          depositsBnb[0]?.privateKey
        ));

      console.log("Transaction:", createTransaction);

      // Deploy transaction
      const createReceipt =
        Number(balance) > 0 &&
        (await web3.eth.sendSignedTransaction(
          createTransaction.rawTransaction
        ));

      console.log(
        `Transaction successful with hash: ${createReceipt.transactionHash}`
      );

      const { data } = await axios.get(
        `https://api.bscscan.com/api?module=account&action=txlist&address=${depositsBnb[0]?.address}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=M9J7Z2RPPGURTWV5A91GASSZ6CXT3EMMR3`
      );

      if (data?.status === "1") {
        const filteredBnb = data.result.filter(
          (bnb) => Number(bnb.from) !== Number(depositsBnb[0]?.address)
        );

        const bnbs =
          filteredBnb.reduce((total, item) => parseInt(item.value) + total, 0) /
          1000000000000000000;

        const { data: result } = await axios.get(
          `https://api.coinlayer.com/convert?access_key=0446bd52d592a6f1580d10cd9f36f29d&from=BNB&to=USDT&amount=${bnbs}`
        );

        //çevirme işlemi sonucu
        const newAmount = numberWithCommas(result?.result);
        const owner = await User.findById({ _id });
        const payment = await Payment.findOne({ userId: _id, coinName: "bnb" });
        const initialValue = owner.usdtBalance + newAmount;

        if (!!payment) {
          owner.usdtBalance = initialValue;
          await owner.save();
          payment.verified_payment = data.result;
          payment.coinName = "bnb";
          await payment.save();
        } else {
          await Payment.create({
            userId: _id,
            verified_payment: data.result,
            coinName: "bnb",
          });

          owner.usdtBalance = initialValue;
          await owner.save();
        }
      }
    }
    const findLogs = await Log.find({ userId: _id });
    const total = findLogs.reduce((s, a) => s + a.usdt, 0);
    const lastUser = await User.findById(_id);
    const newUserUsdtBalance = lastUser.usdtBalance - total;
    lastUser.usdtBalance = newUserUsdtBalance;
    await lastUser.save();

    return successReturn(res, {});
  } catch (err) {
    console.log(err);
    return errorReturn(res, { err });
  }
});

module.exports = {
  createDepositAddress,
  getDepositAddress,
  buyDepositAddress,
  checkDepositAdress,
};
