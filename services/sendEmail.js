const nodemailer = require('nodemailer');
const sendEmail = async ({ mailOptions, next }) => {
  let tranporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  await tranporter.sendMail(mailOptions);
};
module.exports = sendEmail;
