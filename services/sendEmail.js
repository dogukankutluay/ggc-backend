const nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

const sendEmail = async ({ mailOptions, next }) => {
  console.log(process.env.SMTP_USER);
  console.log(process.env.SMTP_PASS);
  let tranporter = nodemailer.createTransport(
    smtpTransport({
      service: 'Yandex',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  );
  return await tranporter.sendMail(mailOptions);
};
module.exports = sendEmail;
