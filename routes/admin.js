const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Log = require('../models/Log');
const Bnb = require('../models/BNB/DepositBnb');
const Tron = require('../models/Deposit');
const {
  getUsers,
  userStatusAction,
  userAssignPrice,
} = require('../controller/admin');
const { isThereAUserAndFind, isAdmin } = require('../middleware/auth');
router
  .post('/getUsers', [isThereAUserAndFind, isAdmin], getUsers)
  .post('/userStatusAction', [isThereAUserAndFind, isAdmin], userStatusAction)
  .post('/userAssignPrice', [isThereAUserAndFind, isAdmin], userAssignPrice)
  .post('/createAdmin', async (req, res) => {
    try {
      await User.create({
        ...req.body,
        role: 'Admin',
        walletNo: '0',
        registerAccess: {
          confirm: true,
        },
      });
      res.sendStatus(200);
    } catch (error) {
      console.log(error);
      res.sendStatus(400);
    }
  })
  .get('/bsadkbjdsfnaasnd', async (req, res) => {
    try {
      let find = await Log.find(req.body).populate({
        path: 'userId',
        select: '-password',
      });
      let totalGgc = find.reduce((pre, init) => {
        return pre + init.ggc;
      }, 0);
      let totalUsdt = find.reduce((pre, init) => {
        return pre + init.usdt;
      }, 0);

      res.json({ totalGgc, totalUsdt, find });
    } catch (error) {
      res.json(error);
    }
  })
  .get('/asldmasdlm', async (req, res) => {
    try {
      res.json({
        bnb: await Bnb.find(req.body).populate({
          path: 'userId',
          select: '-password',
        }),
        tron: await Tron.find(req.body).populate({
          path: 'userId',
          select: '-password',
        }),
      });
    } catch (error) {
      res.json(error);
    }
  });

module.exports = router;
