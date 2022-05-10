const nodemailer = require('nodemailer');
const sendEmail = async ({ mailOptions, next }) => {
  let tranporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    port: 587,
    secure: false,
    host: 'smtp.gmail.com',
  });
  return await tranporter.sendMail(mailOptions);
};
module.exports = sendEmail;
