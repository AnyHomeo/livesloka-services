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
const zoomlink = require("./routes/zoomlink");
const salaryRouter = require("./routes/salary");
const uploadRouter = require("./routes/uploads");
const cancelClassRouter = require("./routes/cancelledClasses");
const classHistoryRouter = require("./routes/classHistory");
const summerCampRouter = require("./routes/summerCamp");

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
app.use("/summercamps",summerCampRouter);
app.use("/class-history", classHistoryRouter);
app.use("/cancelclass", cancelClassRouter);
app.use("/settings", settingsRouter);
app.use("/teacher", teacherRouter);
app.use("/schedule", scheduleRouter);
app.use("/payment", paymentRouter);
app.use("/link", zoomlink);
app.use("/salary", salaryRouter);
app.use("/uploads", uploadRouter);

const PORT = process.env.PORT || 5000;

io.on("connection", (socket) => {
  socket.on("teacher-joined-class", (msg) => {
    io.emit("teacher-joined", msg);
  });
  socket.on("student-joined-class", (msg) => {
    io.emit("student-joined", msg);
  });
});

http.listen(PORT, () => {
  console.log(`Server started at port : ${PORT}`);
});

module.exports = app;
