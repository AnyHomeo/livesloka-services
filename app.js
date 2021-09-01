const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const batch = require('./config/batch');

const indexRouter = require('./routes/admin');
const customerRouter = require('./routes/customer');
const attendanceRouter = require('./routes/attendance');
const settingsRouter = require('./routes/settings');
const teacherRouter = require('./routes/teacher');
const scheduleRouter = require('./routes/schedule');
const paymentRouter = require('./routes/payment');
const zoomlink = require('./routes/zoomlink');
const salaryRouter = require('./routes/salary');
const uploadRouter = require('./routes/uploads');
const cancelClassRouter = require('./routes/cancelledClasses');
const classHistoryRouter = require('./routes/classHistory');
const summerCampRouter = require('./routes/summerCamp');
const CareersRouter = require('./routes/careersApplications');
const teacherLeavesRouter = require('./routes/teacherLeaves');
const AdMessagesRouter = require('./routes/adMessage');
const allocateRouter = require('./routes/AgentsAssignmentsToClass');
const extraAmountsRouter = require('./routes/extraAmounts');
const agentsRouter = require('./routes/agents');
const finalizedSalariesRouter = require('./routes/finalizedSalaries');
const transactionsRouter = require('./routes/transactions');
const expensesRouter = require('./routes/expenses');

const scriptsRouter = require('./routes/scripts');
const subscriptionsRouter = require('./routes/subscriptions');
const chat = require('./routes/chat');
const {
  createNewRoom,
  addNewMessageToRoom,
  addAgentToChatRoom,
  removeAgentFromChatRoom,
} = require('./controllers/chat.controller');

const optionsRouter = require('./routes/options');

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

app.use('/', indexRouter);
app.use('/', customerRouter);
app.use('/', attendanceRouter);
app.use('/', chat);
app.use('/messages', AdMessagesRouter);
app.use('/summercamps', summerCampRouter);
app.use('/careers', CareersRouter);
app.use('/class-history', classHistoryRouter);
app.use('/cancelclass', cancelClassRouter);
app.use('/teacher-leaves', teacherLeavesRouter);
app.use('/settings', settingsRouter);
app.use('/teacher', teacherRouter);
app.use('/schedule', scheduleRouter);
app.use('/payment', paymentRouter);
app.use('/link', zoomlink);
app.use('/salary', salaryRouter);
app.use('/uploads', uploadRouter);
app.use('/allocate', allocateRouter);
app.use('/extra', extraAmountsRouter);
app.use('/agent', agentsRouter);
app.use('/finalize', finalizedSalariesRouter);
app.use('/transactions', transactionsRouter);
app.use('/expenses', expensesRouter);
app.use('/scripts', scriptsRouter);
app.use('/subscriptions', subscriptionsRouter);
app.use('/options', optionsRouter);

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
    socket.emit('roomCreated');

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

  socket.on('notifyToRoomFromUser', ({ roomID, userID }, callback) => {
    try {
      // socket.to(roomID).emit('messageToRoom', { role, message });
      console.log('user wating');
      socket.broadcast.emit('userWating', {
        userID,
        roomID,
      });
    } catch (error) {
      if (error) return callback(error);
    }
    callback();
  });
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
        socket.broadcast.emit('agent-joined-room');
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
  socket.on('disconnecting', async (reason) => {
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

  // socket.on('disconnect', () => {
  //   const agent = users[socket.id];
  //   if (agent) {
  //     console.log(agent.agent + ' left the room ' + agent.roomID);
  //   }
  // });
});

http.listen(PORT, () => {
  console.log(`Server started at port : ${PORT}`);
});

module.exports = app;
