const express = require('express');
const http = require('http');
const path = require('path')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const nunjucks = require('nunjucks')
const dotenv = require('dotenv')
const ColorHash = require('color-hash').default

const socket = require('./socket'); // socket.js 모듈을 불러옴

// ORM
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

dotenv.config();
const webSocket = require('./socket')
const indexRouter = require('./routes')

// Express 앱 설정

const app = express();
app.set('port', process.env.PORT || 3002)
app.set('view engine', 'html');
nunjucks.configure('views', {
  express: app,
  watch: true,
})

app.use(morgan('dev'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({ extended: false}))
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  }
}))

app.use((req, res, next) => {
  if(!req.session.color) {
    const colorHash = new ColorHash()
    req.session.color = colorHash.hex(req.sessionID);
    console.log(req.session.color, req.sessionID)
  }
  next();
})

app.use('/', indexRouter)

app.use((req, res, next) =>{ 
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`)
  error.status = (404);
  next(error)
})

const server = app.listen(app.get('port'), () =>{
  console.log(app.get('port'), '번 포트에서 대기 중')
})

// 소켓 서버 실행
webSocket(server, app);



