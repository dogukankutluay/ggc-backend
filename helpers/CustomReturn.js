const successReturn = (res, json) => {
  return res.status(200).json({ success: true, ...json });
};
const errorReturn = (res, json) => {
  return res.status(400).json({ success: false, ...json });
};
module.exports = {
  errorReturn,
  successReturn,
};
