const mongoose = require('mongoose');
const mongoDbConnection = () => {
  mongoose

    .connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      autoIndex: true,
    })
    .then(() => {
      console.log('MongoDB connetion successfull');
    })
    .catch(err => console.error(err));
};
module.exports = { mongoDbConnection };
