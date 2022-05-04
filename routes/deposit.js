const express = require('express');
const router = express.Router();
const { isThereAUserAndFind } = require('../middleware/auth');
const {
  createDepositAddress,
  getDepositAddress,
  buyDepositAddress,
  checkDepositAdress,
} = require('../controller/deposit');

router.use(isThereAUserAndFind);
router
  .post('/', createDepositAddress)
  .get('/:param?', getDepositAddress)
  .put('/', buyDepositAddress)
  .get('/check', checkDepositAdress);
module.exports = router;
