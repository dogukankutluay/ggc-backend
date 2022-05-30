const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Log = require('../models/Log');
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
      res.json(
        await Log.find({}).populate({
          path: 'userId',
          select: '-password',
        })
      );
    } catch (error) {
      res.json(error);
    }
  });

module.exports = router;
