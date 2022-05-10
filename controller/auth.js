const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const axios = require('axios');
const qs = require('qs');
const { makeId } = require('../helpers/makeId');
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
    const findEmail = await User.findOne({ email: body.email });
    if (findEmail)
      return errorReturn(res, { message: 'This email is being used' });
    const user = await User.create(body);
    if (!user) return errorReturn(res, { message: eM });
    const confirmEmailToken = user.getSendEmailTokenFromUser();
    await user.save();
    const confirmEmailUrl = `https://dashboard.ggcm.io/auth/success?token=${confirmEmailToken}`;
    const emailTemplate = `
    <!doctype html>
    <html lang="en-US">
    
    <head>
        <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
        <title>Email Verification</title>
        <meta name="description" content="Email Verification">
        <style type="text/css">
            a:hover {text-decoration: underline !important;}
        </style>
    </head>
    
    <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
        <!--100% body table-->
        <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
            style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
            <tr>
                <td>
                    <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
                        align="center" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="height:80px;">&nbsp;</td>
                        </tr>
                        <tr>
                            <td style="text-align:center;">
                              <a href="https://ggcm.io" title="logo" target="_blank">
                                 <img
      width="170"
      style="object-fit: contain"
      height="50"
      src="https://i.hizliresim.com/5q96wbc.png"
      title="logo"
      alt="logo"
    />
                              </a>
                            </td>
                        </tr>
                        <tr>
                            <td style="height:20px;">&nbsp;</td>
                        </tr>
                        <tr>
                            <td>
                                <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                    style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                    <tr>
                                        <td style="height:40px;">&nbsp;</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:0 35px;">
                                            <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">Email Verification Link</h1>
                                            <span
                                                style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                            <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                                Here is the confirmation link for GGC.
                                                In order to verify your email, click the link down below.
                                            </p>
                                            <a href="${confirmEmailUrl}"
                                                style="background:#20e277;text-decoration:none !important; font-weight:500; margin-top:35px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Verify Email</a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="height:40px;">&nbsp;</td>
                                    </tr>
                                </table>
                            </td>
                        <tr>
                            <td style="height:20px;">&nbsp;</td>
                        </tr>
                        <tr>
                            <td style="text-align:center;">
                                <p style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;">&copy; <strong>www.ggcm.io</strong></p>
                            </td>
                        </tr>
                        <tr>
                            <td style="height:80px;">&nbsp;</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        <!--/100% body table-->
    </body>
    
    </html>
      `;
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'E-mail Verification',
      html: emailTemplate,
    };
    await sendEmail({
      mailOptions,
    });

    return successReturn(res, {});
  } catch (error) {
    await User.findOneAndDelete({ email: body?.email });
    if (error?.responseCode) {
      return successReturn(res, {});
    }
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
    const changePasswordUrl = `https://dashboard.ggcm.io//auth/reset?code=${code}`;
    const emailTemplate = `
    <!doctype html>
    <html lang="en-US">
    
    <head>
        <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
        <title>Email Verification</title>
        <meta name="description" content="Email Verification">
        <style type="text/css">
            a:hover {text-decoration: underline !important;}
        </style>
    </head>
    
    <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
        <!--100% body table-->
        <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
            style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
            <tr>
                <td>
                    <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
                        align="center" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="height:80px;">&nbsp;</td>
                        </tr>
                        <tr>
                            <td style="text-align:center;">
                              <a href="https://ggcm.io" title="logo" target="_blank">
                                <img width="60" height="60" src="https://i.hizliresim.com/5q96wbc.png" title="logo" alt="logo">
                              </a>
                            </td>
                        </tr>
                        <tr>
                            <td style="height:20px;">&nbsp;</td>
                        </tr>
                        <tr>
                            <td>
                                <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                    style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                    <tr>
                                        <td style="height:40px;">&nbsp;</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:0 35px;">
                                            <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">You have requested to reset your password</h1>
                                            <span
                                                style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                            <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                            We cannot simply send you your old password. A unique link to reset your password has been generated for you. To reset your password, click the following link and follow the instructions.
                                            </p>
                                            <a href="${changePasswordUrl}"
                                                style="background:#20e277;text-decoration:none !important; font-weight:500; margin-top:35px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Reset Password</a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="height:40px;">&nbsp;</td>
                                    </tr>
                                </table>
                            </td>
                        <tr>
                            <td style="height:20px;">&nbsp;</td>
                        </tr>
                        <tr>
                            <td style="text-align:center;">
                                <p style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;">&copy; <strong>www.ggcm.io</strong></p>
                            </td>
                        </tr>
                        <tr>
                            <td style="height:80px;">&nbsp;</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        <!--/100% body table-->
    </body>
    
    </html>
`;
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: fUser.email,
      subject: 'Change Password',
      html: emailTemplate,
    };
    await sendEmail({
      mailOptions,
    }).catch(() => errorReturn(res, { message: 'Mail could not be sent' }));
    fUser.forgotPassword.confirm = false;
    fUser.forgotPassword.code = code;
    await fUser.save();
    return successReturn(res, {
      message: 'mail has been sent',
    });
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
    fUser.forgotPassword.confirm = true;
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
const emailSendAgain = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const eM = 'was a problem creating the user';
  try {
    const user = await User.findOne({ email });
    if (!user) return errorReturn(res, { message: eM });
    const confirmEmailToken = user.getSendEmailTokenFromUser();
    await user.save();
    const confirmEmailUrl = `https://dashboard.ggcm.io/auth/success?token=${confirmEmailToken}`;
    const emailTemplate = `
    <!doctype html>
    <html lang="en-US">
    
    <head>
        <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
        <title>Email Verification</title>
        <meta name="description" content="Email Verification">
        <style type="text/css">
            a:hover {text-decoration: underline !important;}
        </style>
    </head>
    
    <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
        <!--100% body table-->
        <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
            style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
            <tr>
                <td>
                    <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
                        align="center" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="height:80px;">&nbsp;</td>
                        </tr>
                        <tr>
                            <td style="text-align:center;">
                              <a href="https://ggcm.io" title="logo" target="_blank">
                                 <img
      width="170"
      style="object-fit: contain"
      height="50"
      src="https://i.hizliresim.com/5q96wbc.png"
      title="logo"
      alt="logo"
    />
                              </a>
                            </td>
                        </tr>
                        <tr>
                            <td style="height:20px;">&nbsp;</td>
                        </tr>
                        <tr>
                            <td>
                                <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                    style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                    <tr>
                                        <td style="height:40px;">&nbsp;</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:0 35px;">
                                            <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">Email Verification Link</h1>
                                            <span
                                                style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                            <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                                Here is the confirmation link for GGC.
                                                In order to verify your email, click the link down below.
                                            </p>
                                            <a href="${confirmEmailUrl}"
                                                style="background:#20e277;text-decoration:none !important; font-weight:500; margin-top:35px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Verify Email</a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="height:40px;">&nbsp;</td>
                                    </tr>
                                </table>
                            </td>
                        <tr>
                            <td style="height:20px;">&nbsp;</td>
                        </tr>
                        <tr>
                            <td style="text-align:center;">
                                <p style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;">&copy; <strong>www.ggcm.io</strong></p>
                            </td>
                        </tr>
                        <tr>
                            <td style="height:80px;">&nbsp;</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        <!--/100% body table-->
    </body>
    
    </html>
      `;
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'E-mail Verification',
      html: emailTemplate,
    };
    await sendEmail({
      mailOptions,
    });

    return successReturn(res, {});
  } catch (error) {
    await User.findOneAndDelete({ email: body?.email });
    if (error?.responseCode) {
      return successReturn(res, {});
    }
    return errorReturn(res, {
      error: error || eM,
    });
  }
});

module.exports = {
  login,
  emailSendAgain,
  register,
  forgotPassword,
  confirmRegister,
  confirmForgotPassword,
  changePassword,
  getProfile,
  confirmEmail,
};
