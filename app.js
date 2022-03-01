const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const batch = require('./config/batch');
const Routes = require('./Routes');
const Swagger = require('./Swagger');
const Socket = require('./Socket');
const { detectIntent } = require('./dialogflow');
var ip = require('ip');

// const { deleteZoomLinks, createZoomLinks } = require('./scripts/main');

let allowedOrigins = ["https://livesloka.com","https://livekumon.netlify.app"]

if(process.env.ENVIRONMENT !== "PROD"){
  allowedOrigins.push("http://localhost:3000")
}

console.log(ip.address())

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST'],
  },
});
require('dotenv').config();
require('./models/db');
batch();

app.use((req, res, next) => {
  console.log(req.ip)
  next()
})

// view engine setup
app.use(cors({
  origin: allowedOrigins
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.get('/zoom/delete',deleteZoomLinks)
// app.get('/zoom/create',createZoomLinks)

Routes(app);
Swagger(app);
Socket(io);

const PORT = process.env.PORT || 5000;
app.post('/dialogflow', async (req, res) => {
  console.log(req.body);
  let languageCode = req.body.languageCode;
  let queryText = req.body.queryText;
  let sessionId = req.body.sessionId;

  let responseData = await detectIntent(languageCode, queryText, sessionId);

  res.send(responseData.response);
});

http.listen(PORT, () => {
  console.log(`Server started at port : ${PORT}`);
});

module.exports = app;
