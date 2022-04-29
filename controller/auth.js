const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const axios = require('axios');
const qs = require('qs');
const {makeId} =require('../helpers/makeId');
const sendEmail = require('../services/sendEmail');
const { successReturn, errorReturn } = require('../helpers/CustomReturn');
const { comparePassword } = require('../helpers/inputController');
const login = asyncHandler(async (req, res, next) => {
  const { email, phone, password } = req.body;
  let fIn = {};
  email ? (fIn.email = email) : (fIn.phone = phone);
  let eM = 'not found user';
  try {
    const fUser = await User.findOne(fIn);

    if (!fUser) return errorReturn(res, { message: eM });
    if (!fUser.isConfirmedEmail && fUser.role === 'User')
      return errorReturn(res, { message: 'email not confirmed' });
    if (!comparePassword(password, fUser.password))
      return errorReturn(res, { message: eM });

    let result = { token: fUser.generateTokenJwt() };
    return successReturn(res, result);
  } catch (error) {
    return errorReturn(res, {
      error: error || eM,
    });
  }
});
const register = asyncHandler(async (req, res, next) => {
  const body = req.body;
  const eM = 'was a problem creating the user';
  try {
    const user = await User.create(body);
    if (!user) return errorReturn(res, { message: eM });
    const confirmEmailToken = user.getSendEmailTokenFromUser();
    await user.save();
    const confirmEmailUrl = `http://localhost:3000/auth/success?token=${confirmEmailToken}`;
    const emailTemplate = `
          <h3>E-Mail'inizi onaylayınız</h3>
          <p>Bu  <a href="${confirmEmailUrl}" target='_blank'>link</a> ile E-maili'nizi onaylayabilirsiniz.</p>
          <p>Onay süresi 3 gündür.</p>
      `;
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'E-mail Onaylama',
      html: emailTemplate,
    };
    await sendEmail({
      mailOptions,
    });

    return successReturn(res, {});
  } catch (error) {
    return errorReturn(res, {
      error: error || eM,
    });
  }
});
const confirmEmail = asyncHandler(async (req, res, next) => {
  const { confirmEmailToken } = req.query;

  try {
    let userFind = await User.findOne({
      confirmEmailToken,
      confirmEmailExpire: { $gt: Date.now() },
    });
    if (!userFind) return errorReturn(res, { message: 'not found user' });
    userFind.isConfirmedEmail = true;
    userFind.confirmEmailToken = undefined;
    userFind.confirmEmailExpire = undefined;
    await userFind.save();

    return successReturn(res, {
      message: 'Email onaylandı',
      token: userFind.generateTokenJwt(),
    });
  } catch (error) {
    console.log(error);
    return errorReturn(res, {
      error: 'E-Mail Onaylanamadı',
      message: error,
    });
  }
});
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.query;
  let eM = 'not found user';

  try {
    const fUser = await User.findOne({ email });
    if (!fUser) return errorReturn(res, { message: eM });
    if (fUser?.forgotPassword?.confirm === false)
     return errorReturn(res, { message: 'there is already an email sent' });
    const code = makeId(6);
    const changePasswordUrl = `http://localhost:3000/auth/reset?code=${code}`;
    const emailTemplate = `
    <h3>Şifre değişikliği</h3>
    <p>Bu  <a href="${changePasswordUrl}" target='_blank'>link</a> ile şifrenizi sıfırlayabilirsiniz.</p>
    <p>Onay süresi 3 gündür.</p>
`;
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: fUser.email,
      subject: 'Şifre değişikliği',
      html: emailTemplate,
    };
    await sendEmail({
      mailOptions,
    }).catch(()=> errorReturn(res, { message: 'Mail could not be sent' }));
    fUser.forgotPassword.confirm=false;
    fUser.forgotPassword.code=code;
    await fUser.save();
    return successReturn(res, {
           message:"mail has been sent" },
        );
  } catch (error) {
    return errorReturn(res, {
           error: error || error.message,
        });
  }
  // try {
  //   if (!fUser) return errorReturn(res, { message: eM });
  //   if (fUser?.forgotPassword?.confirm === false)
  //     return errorReturn(res, { message: 'there is already an sms sent' });
  //   const sendSms = fUser.sendSmsForForgotPasswordConfirmation();
  //   if (!sendSms) return errorReturn(res, { message: 'sms could not be sent' });
  //   await fUser.save();
  //   return successReturn(res, {
  //     user: { phone: fUser.phone, email: fUser.email },
  //   });
  // } catch (error) {
  //   return errorReturn(res, {
  //     error: error || error.message,
  //   });
  // }
});
const getProfile = asyncHandler(async (req, res, next) => {
  const { user } = req;
  try {
    const userFind = await User.findOne({ _id: user._id }).select('-password');
    return successReturn(res, {
      user: userFind,
    });
  } catch (error) {
    return errorReturn(res, {
      error: error || error.message,
    });
  }
});
const confirmRegister = asyncHandler(async (req, res, next) => {
  const { code, phone } = req.query;
  let eM = 'not found user';

  try {
    const fUser = await User.findOneAndUpdate(
      { 'registerAccess.code': code, phone },
      {
        'registerAccess.confirm': true,
        'registerAccess.code': '',
      }
    );
    if (!fUser) return errorReturn(res, { message: eM });
    return successReturn(res, {});
  } catch (error) {
    return errorReturn(res, {
      error: error || error.message,
    });
  }
});
const confirmForgotPassword = asyncHandler(async (req, res, next) => {
  const { code, phone } = req.query;
  let eM = 'not found user';

  try {
    const fUser = await User.findOneAndUpdate(
      { 'forgotPassword.code': code, phone },
      {
        'forgotPassword.confirm': true,
      }
    );
    if (!fUser) return errorReturn(res, { message: eM });
    return successReturn(res, {});
  } catch (error) {
    return errorReturn(res, {
      error: error || error.message,
    });
  }
});
const changePassword = asyncHandler(async (req, res, next) => {
  const { code, password } = req.body;
  let eM = 'not found user';

  try {
    const fUser = await User.findOne({ 'forgotPassword.code': code });

    if (!fUser) return errorReturn(res, { message: eM });
    fUser.forgotPassword.code = '';
    fUser.forgotPassword.confirm=true;
    fUser.password = password;
    await fUser.save();
    return successReturn(res, {});
  } catch (error) {
    console.log(error);
    return errorReturn(res, {
      error: error || error.message,
    });
  }
});

module.exports = {
  login,
  register,
  forgotPassword,
  confirmRegister,
  confirmForgotPassword,
  changePassword,
  getProfile,
  confirmEmail,
};
