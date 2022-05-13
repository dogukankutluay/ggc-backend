const sendEmail = async ({ mailOptions, next }) => {
  const mailjet = require('node-mailjet').connect(
    'aec4db0980fce349c855efd463130226',
    '42d48794e9231a0bd45a082b44d87cee'
  );
  const request = mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: {
          Email: 'noreply@ggcm.io',
          Name: 'GGC',
        },
        To: [
          {
            Email: mailOptions.to,
          },
        ],
        Subject: mailOptions.subject,
        TextPart: '',
        HTMLPart: mailOptions.html,
      },
    ],
  });
  return await request;
};
module.exports = sendEmail;
