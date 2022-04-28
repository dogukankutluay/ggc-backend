const express = require('express');

const router = express.Router();

const auth = require('./auth');
const admin = require('./admin');
const deposit = require('./deposit');

router.use('/auth', auth);
router.use('/admin', admin);
router.use('/deposit', deposit);

module.exports = router;
