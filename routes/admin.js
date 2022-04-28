const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { getUsers, userStatusAction } = require('../controller/admin');
const { isThereAUserAndFind } = require('../middleware/auth');
router
  .post('/getUsers', [isThereAUserAndFind], getUsers)
  .post('/userStatusAction', [isThereAUserAndFind], userStatusAction)
  .post('/createAdmin', async (req, res) => {
    try {
      await User.create({
        ...req.body,
        status: 'Approve',
        role: 'Admin',
        registerAccess: {
          confirm: true,
        },
      });
      res.sendStatus(200);
    } catch (error) {}
  });

module.exports = router;
