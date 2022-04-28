const express = require('express');
const router = express.Router();

const {
  login,
  register,
  forgotPassword,
  confirmRegister,
  confirmForgotPassword,
  changePassword,
  getProfile,
} = require('../controller/auth');
const { isThereAUserAndFind } = require('../middleware/auth');
const {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  changePasswordSchema,
} = require('../schema/auth.schema');

const {
  globalValidateBody,
  globalValidateQuery,
} = require('../validate/global.validate');

router
  .post('/login', globalValidateBody(loginSchema), login)
  .post('/register', globalValidateBody(registerSchema), register)
  .post(
    '/changePassword',
    globalValidateBody(changePasswordSchema),
    changePassword
  );
router
  .get(
    '/forgotPassword',
    globalValidateQuery(forgotPasswordSchema),
    forgotPassword
  )
  .get('/confirmRegister', confirmRegister)
  .get('/confirmForgotPassword', confirmForgotPassword)
  .get('/getProfile', isThereAUserAndFind, getProfile);
module.exports = router;
