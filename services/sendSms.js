const sdk = require('verimor-node-sdk');
const sendSms = async (phone, msg) => {
  try {
    const client = sdk.createClient({
      username: '908502420114',
      password: '@Ru(ZVfZTL3j=y(2S',
    });
    const payload = {
      source_addr: '',
      messages: [
        {
          msg: msg,
          dest: phone,
        },
      ],
    };
    const r = await client.send(payload);
    if (r.error) return false;
    return true;
  } catch (error) {
    return false;
  }
};
module.exports = sendSms;
