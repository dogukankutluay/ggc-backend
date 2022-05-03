const express = require("express");
const router = express.Router();
const { isThereAUserAndFind } = require("../middleware/auth");
const { getPaymentAddress } = require("../controller/payment");

router.use(isThereAUserAndFind);
router.get("/", getPaymentAddress);
module.exports = router;
