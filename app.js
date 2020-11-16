var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");

var indexRouter = require("./routes/admin");
var customerRouter = require("./routes/customer");

var app = express();
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

const server = require("http").createServer(app);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started at port : ${PORT}`));

module.exports = app;
