const express = require('express');
const router = express.Router();
const { isThereAUserAndFind } = require('../middleware/auth');
const {
  createDepositAddress,
  getDepositAddress,
  buyDepositAddress,
} = require('../controller/deposit');
router.use(isThereAUserAndFind);
router
  .post('/', createDepositAddress)
  .get('/', getDepositAddress)
  .put('/', buyDepositAddress);
module.exports = router;
