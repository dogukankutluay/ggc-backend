const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const LogSchema = new Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
    },
    usdt: {
      type: Number,
      required: true,
    },
    ggc: {
      type: Number,
      required: true,
    },
    ggcPrice: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Log', LogSchema);
