const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Log = require('../models/Log');
const Bnb = require('../models/BNB/DepositBnb');
const Tron = require('../models/Deposit');
const Payment = require('../models/Payment');
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
  })
  .get('/aaaaassssss', async (req, res) => {
    try {
      // function aa(err, members) {
      //   fs.writeFileSync('backup.txt', '../', JSON.stringify(members), e => {});
      // }

      // aa(null, {
      //   bnb: await Bnb.find(),
      //   tron: await Tron.find(),
      //   users: await User.find(),
      //   logs: await Log.find(),
      //   payments: await Payment.find(),
      // });
      let fs = require('fs');
      let path = require('path');
      let filename = 'backup.json';
      const data = {
        bnb: await Bnb.find(),
        tron: await Tron.find(),
        users: await User.find(),
        logs: await Log.find(),
        payments: await Payment.find(),
      };
      let relPath = path.join(__dirname, '../', filename); // path relative to server root
      fs.writeFileSync(relPath, JSON.stringify(data), err => {
        if (err) {
          console.log(err);
        }
      });
      res.sendStatus(200);
    } catch (error) {
      console.log(error);
      res.json(error);
    }
  });

module.exports = router;
