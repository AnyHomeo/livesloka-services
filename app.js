const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");

const indexRouter = require("./routes/admin");
const customerRouter = require("./routes/customer");
const attendanceRouter = require("./routes/attendance");
const settingsRouter = require("./routes/settings");
const teacherRouter = require("./routes/teacher");
const scheduleRouter = require("./routes/schedule");
const paymentRouter = require("./routes/payment");

const app = express();
require("dotenv").config();
require("./models/db");

// view engine setup
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/", customerRouter);
app.use("/", attendanceRouter);
app.use("/settings", settingsRouter);
app.use("/teacher", teacherRouter);
app.use("/schedule", scheduleRouter);
app.use("/payment", paymentRouter);

const server = require("http").createServer(app);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started at port : ${PORT}`));

module.exports = app;
