const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors')
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
    }
});
const prisma = new PrismaClient();

const PORT = 3000;

app.use(express.static('public'));


app.use(cors({
    origin: '*',
}));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());


// 채팅방 목록들
app.get('/rooms', async (req, res) => {
    try {
        const rooms = await prisma.room.findMany();
        res.json(rooms);
    } catch (error) {
        console.error(` 방 불러오기 실패: ${error.message}`);
        res.status(500).json({ error: '방 목록 불러오기 실패' });
    }
});

// user 정보 조회하기
app.get('/getUserInfo/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id)
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })
        console.log(user);
        res.status(200).json(user)
    } catch (error) {
        console.error(`user 정보 조회하기 실패: ${error.message}`);
        res.status(500).json({ error : ' 유저 정보 조회하기 실패' })
    }
})

// 각 방의 최근 메세지 가져오기
app.get('/recent-messages', async (req, res) => {
    try {
        const recentMessages = await prisma.room.findMany({
            select: {
                id: true,
                title: true,
                chats: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                    select: {
                        chat: true,
                        createdAt: true,
                        user: {
                            select: {
                                nickname: true,
                            },
                        },
                    },
                },
            },
        });
        res.json(recentMessages);
    } catch (error) {
        console.error(`최근 메세지 가져오기 실패: ${error.message}`);
        res.status(500).json({ error: '최근 메세지 가져오기 실패' });
    }
});

// 채팅관련
io.on('connection', (socket) => {
    console.log('유저 연결됨');

    // 채팅방에 참가 
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

    // 채팅 메세지 전송
    socket.on('chat message', async ({ roomId, userId, message }) => {
        try {
            const chat = await prisma.chat.create({
                data: {
                roomKey: roomId,
                userKey: userId,
                chat: message,
            },
        });

        // 특정 방 (roomId) 에 메세지 전송
        io.to(roomId).emit('chat message', chat);
        console.log(chat);
        } catch (error) {
            console.error(`메세지 보내기 실패: ${error.message}`);
            socket.emit('error', '메세지 보내기 실패');
        }
    });

    // 소켓 연결 해제
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
