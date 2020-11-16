const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");

const indexRouter = require("./routes/admin");
const customerRouter = require("./routes/customer");
const attendanceRouter = require("./routes/attendance");

const app = express();
require("./config/config");
require("./models/db");
require("./config/passportConfig");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/", customerRouter);
app.use("/", attendanceRouter);

const server = require("http").createServer(app);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started at port : ${PORT}`));

module.exports = app;
