const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const DepositSchema = new Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    usdt: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      required: true,
      unique: true,
    },
    privateKey: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Deposit", DepositSchema);
