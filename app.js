const express = require('express');
const http = require('http');
const socket = require('./socket'); // socket.js 모듈을 불러옴
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Express 앱 설정

const app = express();
const server = http.createServer(app);

// 소켓 서버 실행
socket(server);

// 서버 시작
const port = process.env.PORT || 3002;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
