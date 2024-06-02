const express = require('express');
const http = require('http');
const session = require('express-session');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const prisma = new PrismaClient();

const PORT = 3000;

app.use(express.static('public'));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
    maxAge: 1000 * 60 * 60
    }
}));

app.use(cors({
    origin: '*',
}));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (user) {
            if (password === user.password) {
                req.session.user = user;
                console.log(req.session.user);
                return res.status(200).json(user);
            } else {
                return res.status(401).json({ error: 'Unauthorized' });
            }
        } else {
            return res.status(404).json({ error: 'User Not Found' });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'login error' });
    }
});

app.get('/rooms', async (req, res) => {
    try {
        const rooms = await prisma.room.findMany();
        res.json(rooms);
    } catch (error) {
        console.error(` 방 불러오기 실패: ${error.message}`);
        res.status(500).json({ error: '방 목록 불러오기 실패' });
    }
});

io.on('connection', (socket) => {
    console.log('유저 연결됨');

    socket.on('join room', async (roomId) => {
        try {
            const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: { chats: true },
        });

        if (!room) {
            console.error(`${roomId}방은 존재하지 않습니다.`);
            socket.emit('error', '방이 존재하지 않습니다.');
            return;
        }

        socket.join(roomId);
        socket.emit('room history', room.chats);
        } catch (error) {
            console.error(`채팅 및 방 찾기 실패: ${error.message}`);
            socket.emit('error', '채팅 및 방 찾기 실패');
        }
  });

    socket.on('chat message', async ({ roomId, userId, message }) => {
        try {
            const chat = await prisma.chat.create({
                data: {
                roomKey: roomId,
                userKey: userId,
                chat: message,
            },
        });
        io.to(roomId).emit('chat message', chat);
        console.log(chat);
        } catch (error) {
            console.error(`메세지 보내기 실패: ${error.message}`);
            socket.emit('error', '메세지 보내기 실패');
    }
  });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
