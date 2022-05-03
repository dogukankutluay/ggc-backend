const express = require("express");

const router = express.Router();

const auth = require("./auth");
const admin = require("./admin");
const deposit = require("./deposit");
const payment = require("./payment");

router.use("/auth", auth);
router.use("/admin", admin);
router.use("/deposit", deposit);
router.use("/payment", payment);

module.exports = router;
