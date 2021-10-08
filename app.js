const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const batch = require('./config/batch');
const Routes = require('./Routes');
const Swagger = require('./Swagger');

const {
  createNewRoom,
  addNewMessageToRoom,
  addAgentToChatRoom,
  removeAgentFromChatRoom,
  getAgentAssignedToRoom,
} = require('./controllers/chat.controller');
const { addMessageToGroup } = require('./controllers/group.controller');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
require('dotenv').config();
require('./models/db');
batch();

// view engine setup
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

Routes(app);
Swagger(app);

const PORT = process.env.PORT || 5000;
const users = {};

io.on('connection', (socket) => {
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
    // socket.emit('roomCreated');

    callback();
  });

  // socket.on("create-newuser-room", async ({roomID, userID}, callback) => {
  // 	try {
  // 		const data = await NonUser.createNewRoom(userID, roomID)
  // 		console.log(data)
  // 	} catch (error) {
  // 		console.log(error)
  // 		if (error) return callback(error)
  // 	}
  // 	socket.join(roomID)
  // 	socket.emit("newUserRoomCreated", {userID})

  // 	callback()
  // })

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
  // socket.on("notifyToNonUserRoom", ({roomID, userID}, callback) => {
  // 	try {
  // 		// socket.to(roomID).emit('messageToRoom', { role, message });
  // 		console.log("user wating")
  // 		socket.broadcast.emit("nonUserWating", {
  // 			message: userID + " is wating in the room " + roomID,
  // 		})
  // 	} catch (error) {
  // 		if (error) return callback(error)
  // 	}
  // 	callback()
  // })
  socket.on('messageFromBot', async ({ roomID, message, name }, callback) => {
    try {
      const data = await addNewMessageToRoom(roomID, message, 1, name);
      socket
        .to(roomID)
        .emit('messageToRoomFromBot', { role: 1, message, name });
    } catch (error) {
      if (error) return callback(error);
    }

    callback();
  });
  socket.on(
    'messageFromBotToGroup',
    async ({ groupID, message, userID, username, role }, callback) => {
      try {
        const data = await addMessageToGroup(
          groupID,
          message,
          role,
          userID,
          username
        );
        socket
          .to(groupID)
          .emit('messageToGroupFromBot', { role, message, userID, username });
        socket.broadcast.emit('message-to-group-from-bot', groupID);
      } catch (error) {
        if (error) return callback(error);
      }

      callback();
    }
  );
  // socket.on("messageFromNonUser", async ({roomID, message}, callback) => {
  // 	try {
  // 		const data = await NonUser.addNewMessageToRoom(roomID, message, 1)
  // 		socket.to(roomID).emit("messageToNonRoomFromNonUser", {role: 1, message})
  // 	} catch (error) {
  // 		if (error) return callback(error)
  // 	}

  // 	callback()
  // })
  socket.on(
    'messageFromAdmin',
    async ({ roomID, message, isSuperAdmin, name }, callback) => {
      let role = isSuperAdmin ? 3 : 4;
      console.log(role);
      try {
        const data = await addNewMessageToRoom(roomID, message, role, name);
        console.log(message, roomID);

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
    async ({ groupID, message, isSuperAdmin, userID, username }, callback) => {
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
  // socket.on("messageFromNonRoomAdmin", async ({roomID, message, isSuperAdmin}, callback) => {
  // 	let role = isSuperAdmin ? 3 : 4
  // 	console.log(role)
  // 	try {
  // 		const data = await NonUser.addNewMessageToRoom(roomID, message, role)
  // 		console.log(message, roomID)

  // 		socket.to(roomID).emit("messageToNonRoomFromAdmin", {
  // 			role,
  // 			message,
  // 		})
  // 	} catch (error) {
  // 		if (error) return callback(error)
  // 	}

  // 	callback()
  // })
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

  socket.on('JOIN_GROUP', async ({ groupID, isAgent }, callback) => {
    try {
      console.log('joined the group', groupID, isAgent);
      //  if (isAgent) {
      //    const id = socket.id;
      //    socket.broadcast.emit('agent-joined-room', isAgent);

      //    const value = Object.values(users).find(
      //      (user) => user.roomID === roomID && user.agent === isAgent
      //    );
      //    if (value) {
      //      console.log(value);

      //      delete users[value.id];
      //    }

      //    users[id] = {
      //      roomID,
      //      agent: isAgent,
      //      id,
      //    };
      //    console.table(users);
      //  }
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
  socket.on('disconnect', async (reason) => {
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

http.listen(PORT, () => {
  console.log(`Server started at port : ${PORT}`);
});

module.exports = app;
