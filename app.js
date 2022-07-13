const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const batch = require("./config/batch");
const Routes = require("./Routes");
const Swagger = require("./Swagger");
const Socket = require("./Socket");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
require("dotenv").config();
require("./models/db");
batch();



// view engine setup
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

Routes(app);
Swagger(app);
Socket(io);

const PORT = process.env.PORT || 5000;

http.listen(PORT, () => {
  console.log(`Server started at port : ${PORT}`);
});

module.exports = app;
