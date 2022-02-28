const {
  createNewRoom,
  addNewMessageToRoom,
  addAgentToChatRoom,
  removeAgentFromChatRoom,
  getAgentAssignedToRoom,
} = require('./controllers/chat.controller');

const {
  addNewMessageToNonRoom,
  findAllMessagesByNonRoom,
  createNewNonRoom,
} = require('./controllers/nonchat.controller');

const { addMessageToGroup } = require('./controllers/group.controller');
const { detectIntent } = require('./dialogflow');
const { v4: uuidv4 } = require('uuid');

module.exports = (io) => {
  const users = {};
  const chatAgents = {};

  io.on('connection', (socket) => {
    socket.on('login', function (data) {
      console.log('a user ' + data.userId + ' connected');
      // saving userId to object with socket ID
      chatAgents[socket.id] = data.userId;
    });
    socket.on('teacher-joined-class', (msg) => {
      io.emit('teacher-joined', msg);
    });
    socket.on('student-joined-class', (msg) => {
      io.emit('student-joined', msg);
    });

    socket.on('agent-assigned-class', (data) => {
      socket.broadcast.emit('agent-assigned', data);
    });

    //---Chat Socket Implementation

    socket.on('create-room', async ({ roomID, userID }, callback) => {
      try {
        const data = await createNewRoom(userID, roomID);
        console.log(data);
      } catch (error) {
        if (error) return callback(error);
      }
      socket.join(roomID);
      callback();
    });

    socket.on(
      'create-nonroom',
      async ({ roomID, username, country }, callback) => {
        try {
          const data = await createNewNonRoom(username, roomID, country);
          console.log(data);
        } catch (error) {
          console.log(error);
          if (error) return callback(error);
        }
        socket.join(roomID);

        socket.broadcast.emit('new-non-user-pinged', {
          username,
          roomID,
        });
        callback();
      }
    );
    socket.on(
      'notifyToRoomFromUser',
      async ({ roomID, userID, typeMessage }, callback) => {
        try {
          // socket.to(roomID).emit('messageToRoom', { role, message });
          const theAgent = await getAgentAssignedToRoom(roomID);
          console.log(theAgent);

          if (!theAgent.agentID) {
            socket.broadcast.emit('userWating', {
              userID,
              roomID,
              typeMessage,
            });
          }

          const name = userID;
          const message = typeMessage;
          if (message !== 'Please write us your query') {
            await addNewMessageToRoom(roomID, message, 1, name);
            socket
              .to(roomID)
              .emit('messageToRoomFromBot', { role: 1, message, name });
          } else if (message === 'Please write us your query') {
            await addNewMessageToRoom(roomID, 'Others', 1, name);
            socket.to(roomID).emit('messageToRoomFromBot', {
              role: 1,
              message: 'Others',
              name,
            });
          }
        } catch (error) {
          if (error) return callback(error);
        }
        callback();
      }
    );
    socket.on(
      'messageFromNonBot',
      async ({ roomID, message, username, isBot }, callback) => {
        console.log(roomID, message);
        try {
          await addNewMessageToNonRoom(roomID, message, 0, username);
          socket
            .to(roomID)
            .emit('messageToNonRoomFromBot', { role: 0, message, username });
          socket.broadcast.emit('non-user-pinged', {
            roomID,
          });
          if (isBot) {
            const data = await detectIntent('en', message, uuidv4());
            data['online'] = Object.keys(chatAgents).length === 0;
            callback({ error: false, data });
            await addNewMessageToNonRoom(roomID, data.response, 3, 'Kuhu');
            socket.to(roomID).emit('messageToNonRoomFromBot', {
              role: 3,
              message: data.response,
              username: 'Kuhu',
            });
          } else {
            callback({ error: false, data: null });
          }
        } catch (error) {
          console.log(error);
          if (error) return callback({ error: true, data: error });
        }
      }
    );
    socket.on(
      'messageFromBotToGroup',
      async (
        {
          groupID,
          message,
          userID,
          username,
          role,
          reply,
          messageType,
          fileURL,
        },
        callback
      ) => {
        try {
          const data = await addMessageToGroup(
            groupID,
            message,
            role,
            userID,
            username,
            reply,
            messageType,
            fileURL
          );
          socket.to(groupID).emit('messageToGroupFromBot', {
            role,
            message,
            userID,
            username,
            reply,
            messageType,
            fileURL,
          });
          socket.broadcast.emit('message-to-group-from-bot', {
            groupID,
            userID,
            message,
            username,
          });
        } catch (error) {
          if (error) return callback(error);
        }

        callback();
      }
    );

    socket.on(
      'messageFromAdmin',
      async ({ roomID, message, isSuperAdmin, name }, callback) => {
        let role = isSuperAdmin ? 3 : 4;
        console.log(role);
        try {
          await addNewMessageToRoom(roomID, message, role, name);
          socket.to(roomID).emit('messageToRoomFromAdmin', {
            role,
            message,
            name,
          });

          socket.to(roomID).emit('agent-read-message');
        } catch (error) {
          if (error) return callback(error);
        }

        callback();
      }
    );
    socket.on(
      'adminmessageToGroup',
      async (
        { groupID, message, isSuperAdmin, userID, username },
        callback
      ) => {
        let role = isSuperAdmin ? 3 : 4;
        try {
          const data = await addMessageToGroup(
            groupID,
            message,
            role,
            userID,
            username
          );

          socket.to(groupID).emit('adminmessageToGroup', {
            role,
            message,
            userID,
            username,
          });
        } catch (error) {
          if (error) return callback(error);
        }

        callback();
      }
    );

    socket.on(
      'messageFromNonRoomAdmin',
      async ({ roomID, message, isSuperAdmin, username }, callback) => {
        let role = isSuperAdmin ? 3 : 4;
        try {
          await addNewMessageToNonRoom(roomID, message, role, username);
          socket.to(roomID).emit('messageToNonRoomFromAdmin', {
            role,
            message,
            username,
          });

          //  socket.to(roomID).emit('agent-read-message');
        } catch (error) {
          if (error) return callback(error);
        }

        callback();
      }
    );

    socket.on(
      'user-typing',
      async ({ roomID, name, typing, message }, callback) => {
        console.log(roomID, name, message, typing);

        socket.to(roomID).emit('user-typing', { name, message, typing });
        try {
        } catch (error) {
          if (error) return callback(error);
        }
        callback();
      }
    );
    socket.on('agent-typing', async ({ roomID, name, typing }, callback) => {
      socket.to(roomID).emit('agent-typing', { name, typing });
      try {
      } catch (error) {
        if (error) return callback(error);
      }
      callback();
    });

    socket.on(
      'non-user-typing',
      async ({ roomID, username, typing, message }, callback) => {
        console.log(roomID, username, message, typing);

        socket
          .to(roomID)
          .emit('non-user-typing', { username, message, typing });
        try {
        } catch (error) {
          if (error) return callback(error);
        }
        callback();
      }
    );
    socket.on(
      'non-agent-typing',
      async ({ roomID, username, typing }, callback) => {
        socket.to(roomID).emit('non-agent-typing', { username, typing });
        try {
        } catch (error) {
          if (error) return callback(error);
        }
        callback();
      }
    );

    socket.on('joinChatRoom', async ({ roomID, adminID }, callback) => {
      try {
        // const data = await addAdminToChatRoom(roomID, adminID);
        console.log('injoin chatroom', adminID, roomID);
        socket.join(roomID);
      } catch (error) {
        if (error) return callback(error);
      }
      callback();
    });
    socket.on('JOIN_ROOM', async ({ roomID, isAdmin, isAgent }, callback) => {
      try {
        console.log('joined the chatroom', isAdmin, roomID, isAgent);
        if (isAgent) {
          const data = await addAgentToChatRoom(roomID, isAgent);
          console.log(data.agentID);
          const id = socket.id;
          socket.broadcast.emit('agent-joined-room', isAgent);
          console.log('agent joined the chatroom', isAgent);

          const value = Object.values(users).find(
            (user) => user.roomID === roomID && user.agent === isAgent
          );
          if (value) {
            console.log(value);

            delete users[value.id];
          }

          users[id] = {
            roomID,
            agent: isAgent,
            id,
          };
          console.table(users);
        }
      } catch (error) {
        if (error) return callback(error);
      }
      socket.join(roomID);
      callback();
    });

    socket.on('JOIN_NONROOM', async ({ roomID, isAgent }, callback) => {
      try {
        console.log('joined the group', roomID, isAgent);
      } catch (error) {
        if (error) return callback(error);
      }
      socket.join(roomID);
      callback();
    });
    socket.on('JOIN_GROUP', async ({ groupID, isAgent }, callback) => {
      try {
        console.log('joined the group', groupID, isAgent);
      } catch (error) {
        if (error) return callback(error);
      }
      socket.join(groupID);
      callback();
    });
    socket.on(
      'agent-to-agent-assign',
      ({ agentID, roomID, assigneID, user }, callback) => {
        try {
          socket.broadcast.emit('agent-to-agent-assign', {
            agentID,
            roomID,
            assigneID,
            user,
          });
        } catch (error) {
          if (error) return callback(error);
        }
        callback();
      }
    );

    socket.on(
      'agent-to-agent-assign',
      ({ agentID, roomID, assigneID, user }, callback) => {
        try {
          socket.broadcast.emit('agent-to-agent-assign', {
            agentID,
            roomID,
            assigneID,
            user,
          });
        } catch (error) {
          if (error) return callback(error);
        }
        callback();
      }
    );

    socket.on('toggleNonChatBot', ({ show }, callback) => {
      try {
        socket.broadcast.emit('toggleNonChatBot', {
          show,
        });
      } catch (error) {
        if (error) return callback(error);
      }
      callback();
    });

    socket.on('agent-needed-nonchat', ({ username, roomID }) => {
      socket.broadcast.emit('new-non-user-pinged', {
        username,
        roomID,
      });
    });

    socket.on('disconnect', async (reason) => {
      delete chatAgents[socket.id];
      const agent = users[socket.id];
      if (agent) {
        delete users[socket.id];
        console.error(agent.agent + reason + agent.roomID);
        const result = await removeAgentFromChatRoom(agent.roomID, agent.agent);
        if (result) {
          socket.broadcast.emit('agent-disconnected');
        }
      }
    });
  });
};
