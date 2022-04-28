const { mongoDbConnection } = require('./mongoDb/mongoDbConnection');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const app = express();

const router = require('./routes/index');

dotenv.config({
  path: './config/env/config.env',
});

mongoDbConnection();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/v1', router);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`****server started ${PORT}****`);
});
