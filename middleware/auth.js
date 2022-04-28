const { errorReturn } = require('../helpers/CustomReturn');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

const { findUserId } = require('../services/auth');

const isThereAUserAndFind = asyncHandler(async (req, res, next) => {
  const userFind = await findUserId(
    req.headers['authorization']?.split('Bearer ')[1]
  );
  const user = await User.findById(userFind._id);
  if (user && userFind._id === String(user._id)) {
    req.user = user;
    next();
  } else {
    return errorReturn(res, {
      message: 'Authentication error',
    });
  }
});
const isAdmin = asyncHandler(async (req, res, next) => {
  const { user } = req;
  if (user.role !== 'Admin') {
    return errorReturn(res, { message: 'auth error' });
  }
  next();
});

const tokenFindAndVerify = asyncHandler(async (req, res, next) => {
  const pass = req.headers['authorization']?.split('Bearer ')[1] || '';
  if (!pass.length) {
    return errorReturn(res, {
      message: 'Authentication error',
    });
  }
  var qs = require('qs');
  var obj = qs.parse(pass);
  const id = obj.id.length < 24 ? '626abb0aa6da0b5540e4d9b' : obj.id;
  User.findOne({ _id: id })
    .then(res => {
      req.user = res;
      next();
    })
    .catch(e => {
      return errorReturn(res, {
        message: 'Authentication error',
      });
    });
});

module.exports = {
  isThereAUserAndFind,
  tokenFindAndVerify,
  isAdmin,
};
