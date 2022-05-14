const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const PaymentSchema = new Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
    },
    verified_payment: {
      type: Array,
      required: true,
    },
    coinName: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', PaymentSchema);
