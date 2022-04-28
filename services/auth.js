const jwt = require('jsonwebtoken');
const findUserId = async token => {
  return new Promise(async (resolve, reject) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded._id) {
        resolve({ _id: decoded._id });
      } else {
        resolve('Access Denied');
      }
    } catch (error) {
      resolve('Access Denied');
    }
  });
};
module.exports = {
  findUserId,
};
