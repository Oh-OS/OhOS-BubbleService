// socket.js

const socket = require('socket.io');

module.exports = (server, app) => {
  const io = socket(server, {
    cors: {
      origin: '*',
      credentials: true,
    },
  });
  app.set('socket.io', io);

  // 메모리 내 객체로 대체
  const rooms = {};
  const users = {};

  io.on('connection', (socket) => {
    console.log('a user connected');

    // 채팅방 접속 (입장 전)
    socket.on('join-room', (data) => {
      let { roomKey, userKey, nickname, roomTitle } = data;

      // 데이터 유효성 검증
      if (!roomKey || !userKey || !nickname || !roomTitle) {
        console.log('Invalid data received on join-room:', data);
        return;
      }

      // 사용자와 방 정보를 메모리에 저장
      if (!rooms[roomKey]) {
        rooms[roomKey] = { title: roomTitle, users: [] };
      }
      if (!users[userKey]) {
        users[userKey] = { nickname, roomKey };
      }

      const enterUser = users[userKey];
      const room = rooms[roomKey];

      // 방에 유저 추가
      room.users.push(userKey);

      // 해당 채팅방 입장
      socket.join(room.title);

      // 관리자 환영 메시지 보내기
      let param = { nickname: enterUser.nickname };
      io.to(room.title).emit('welcome', param);

      console.log(`${enterUser.nickname}님이 ${room.title}에 입장했습니다.`);
    });

    // 채팅 받아서 저장하고, 그 채팅 보내서 보여주기
    socket.on('chat_message', (data) => {
      let { message, roomKey, userKey } = data;

      // 데이터 유효성 검증
      if (!message || !roomKey || !userKey) {
        console.log('Invalid data received on chat_message:', data);
        return;
      }

      const chatUser = users[userKey];
      const room = rooms[roomKey];

      if (chatUser && room) {
        // 채팅 보내주기
        let param = {
          message,
          roomKey,
          nickname: chatUser.nickname,
          time: new Date().toISOString(),
        };

        io.to(room.title).emit('message', param);
        console.log(`${chatUser.nickname}: ${message}`);
      }
    });

    // 채팅방 나가기 (채팅방에서 아예 퇴장)
    socket.on('leave-room', (data) => {
      let { roomKey, userKey } = data;

      // 데이터 유효성 검증
      if (!roomKey || !userKey) {
        console.log('Invalid data received on leave-room:', data);
        return;
      }

      const leaveUser = users[userKey];
      const room = rooms[roomKey];

      if (leaveUser && room) {
        let param = { nickname: leaveUser.nickname };
        io.to(room.title).emit('bye', param);
        console.log(`${leaveUser.nickname}님이 ${room.title}에서 퇴장했습니다.`);

        // 사용자 정보와 방 정보 업데이트
        delete users[userKey];
        room.users = room.users.filter(user => user !== userKey);

        // 방에 더 이상 사용자가 없으면 방 삭제
        if (room.users.length === 0) {
          delete rooms[roomKey];
        }
      }
    });
  });
};
