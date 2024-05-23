// socket.js

const socket = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = (server) => {
  const io = socket(server, {
    cors: {
      origin: '*',
      credentials: true,
    },
  });

  // 소켓 연결
  io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('join-room', async (data) => {
      const { roomKey, userKey } = data;
      const enterUser = await prisma.participant.findUnique({
        where: { roomKey_userKey: { roomKey, userKey } },
        include: {
          user: true,
          room: true,
        },
      });

      socket.join(enterUser.room.title);
      const enterMsg = await prisma.chat.findFirst({
        where: {
          roomKey,
          userKey: 12,
          chat: `${enterUser.user.nickname}님이 입장했습니다.`,
        },
      });

      if (!enterMsg) {
        await prisma.chat.create({
          data: {
            roomKey,
            userKey: 12,
            chat: `${enterUser.user.nickname}님이 입장했습니다.`,
          },
        });

        const param = { nickname: enterUser.user.nickname };
        io.to(enterUser.room.title).emit('welcome', param);
      }
    });

    socket.on('chat_message', async (data) => {
      const { message, roomKey, userKey } = data;
      const newChat = await prisma.chat.create({
        data: {
          roomKey,
          userKey,
          chat: message,
        },
      });

      const chatUser = await prisma.participant.findUnique({
        where: { roomKey_userKey: { roomKey, userKey } },
        include: {
          user: true,
          room: true,
        },
      });

      const param = {
        message,
        roomKey,
        nickname: chatUser.user.nickname,
        time: newChat.createdAt,
      };

      io.to(chatUser.room.title).emit('message', param);
    });

    socket.on('leave-room', async (data) => {
      const { roomKey, userKey } = data;
      const leaveUser = await prisma.participant.findUnique({
        where: { roomKey_userKey: { roomKey, userKey } },
        include: {
          user: true,
          room: true,
        },
      });

      if (userKey === leaveUser.room.userKey) {
        const param = { nickname: leaveUser.user.nickname };
        socket.broadcast.to(leaveUser.room.title).emit('byeHost', param);
      } else {
        await prisma.chat.create({
          data: {
            roomKey,
            userKey: 12,
            chat: `${leaveUser.user.nickname}님이 퇴장했습니다.`,
          },
        });

        const param = { nickname: leaveUser.user.nickname };
        io.to(leaveUser.room.title).emit('bye', param);
      }
    });
  });
};
