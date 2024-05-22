// app.js

const express = require('express');
const Router = require('./socket');

const webSocket = require('./socket');

require('dotenv').config();
const port = process.env.PORT;

const app = express();

const path = require('path');
app.use(express.static(path.join(__dirname, 'src')));

app.use(express.json());
app.use('/api', Router);
app.get('/', (req, res) => {
  res.status(200).json({ massage: '연동 잘 됨.' });
});

const server = app.listen(port, () => {
  console.log(port, '포트로 서버가 열렸어요!');
});

webSocket(server, app);

module.exports = app;