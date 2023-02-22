// Get dependencies
require("dotenv").config();
const compression = require("compression");
const express = require("express");
const path = require("path");
const http = require("http");
const bodyParser = require("body-parser");
//const nodemailer = require('nodemailer');
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const session = require("express-session");
const morgan = require("morgan");
// Get our API routes
const api = require("./routes/api");
const mongo = require("./routes/mongodb");
const accessControl = require("./routes/accessControl");
const mail = require("./routes/mailAPI");
const cors = require("cors");
const app = express();
const socketIO = require("socket.io");
var multer = require("multer");
const mysql = require("mysql");
var fs = require("fs");
var schedule = require("node-schedule");
var eventConfirm = require("./routes/eventConfirm");
var reminderViaEmail = require("./routes/reminderViaEmail");
var reminderViaSMS = require("./routes/reminderViaSMS");
var sendHappyBirthdayViaSMS = require("./routes/sendHappyBirthdayViaSMS");
var sendHappyBirthdayViaEmail = require("./routes/sendHappyBirthdayViaEmail");
var checkLicenceExpired = require("./routes/checkLicenceExpired");
const mailServer = require("./routes/dynamic-mail-server/mail-server");
const payment = require("./routes/payment-process");

app.use(compression());

var connection = mysql.createPool({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
});

//for upload image
app.use(function (req, res, next) {
  //allow cross origin requests
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, PUT, OPTIONS, DELETE, GET"
  );
  res.header("Access-Control-Allow-Origin", "http://localhost:4200");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./routes/uploads/");
  },
  filename: function (req, file, cb) {
    // console.log(req);
    var datetimestamp = Date.now();
    cb(
      null,
      file.fieldname +
        "-" +
        datetimestamp +
        "." +
        file.originalname.split(".")[file.originalname.split(".").length - 1]
    );
  },
});

var upload = multer({
  //multer settings
  storage: storage,
}).single("file");

app.post("/upload", function (req, res) {
  upload(req, res, function (err) {
    connection.getConnection(function (err, conn) {
      if (err) {
        res.json({
          code: 100,
          status: "Error in connection database",
        });
        return;
      }

      var test = {};
      console.log(req);
      // console.log(storage.getFilename());
      var doc = {
        customer_id: req.body.customer_id,
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        date: req.body.date,
        description: req.body.description,
        filename: req.file.filename,
        path: req.file.path,
      };
      /*var doc = {
        'customer_id': req.body.customer_id,
        'name': req.file.originalname,
        'type': req.file.mimetype,
        'size': req.file.size,
        'filename': req.file.filename,
        'path': req.file.path
    }*/

      conn.query("insert into documents SET ?", doc, function (err, rows) {
        conn.release();
        if (!err) {
          if (!err) {
            test.id = rows.insertId;
            test.success = true;
          } else {
            test.success = false;
          }
          res.json(test);
        } else {
          res.json({
            code: 100,
            status: "Error in connection database",
          });
          console.log(err);
        }
      });
      conn.on("error", function (err) {
        console.log("[mysql error]", err);
      });
    });
  });
});

// Parsers for POST data
app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

app.use(cors());

app.use(cookieParser());
app.use(
  session({
    secret: "management",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 300 * 30,
    },
  })
);
// loguje svaki zahtev u konzolurs
app.use(morgan("dev"));

// Point static path to dist
app.use(express.static(path.join(__dirname, "../client/dist")));

// Set our api routes
app.use("/api", api);
app.use("/api", mail);
app.use("/api", mongo);
app.use("/api/mail-server", mailServer);
app.use("/api/payment", payment);

// Catch all other routes and return the index file
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

/**
 * Get port from environment and store in Express.
 */
const port = process.env.PORT || "3000";
app.set("port", port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

const io = socketIO(server);

let numberOfOnlineUsers = 0;

io.on("connection", (socket) => {
  numberOfOnlineUsers++;
  socket.on("/", (numberOfOnlineUsers) => {
    console.log("test");
    socket.emit("numberOfOnlineUsers", numberOfOnlineUsers);
  });

  socket.on("disconnect", () => {
    numberOfOnlineUsers--;
    socket.emit("numberOfOnlineUsers", numberOfOnlineUsers);
    console.log("User disconnected");
  });
});

var eventRule = new schedule.RecurrenceRule();
eventRule.hour = 9;
eventRule.minute = 00;
var j = schedule.scheduleJob(eventRule, function () {
  eventConfirm();
});

var reminderViaEmailRule = new schedule.RecurrenceRule();
reminderViaEmailRule.hour = 10;
reminderViaEmailRule.minute = 00;
var j = schedule.scheduleJob("00 10 * * *", function () {
  reminderViaEmail();
});

var reminderViaSMSRule = new schedule.RecurrenceRule();
reminderViaSMSRule.hour = 12;
reminderViaSMSRule.minute = 00;
var j = schedule.scheduleJob("00 12 * * *", function () {
  reminderViaSMS();
});

var sendHappyBirthdayViaSMSRule = new schedule.RecurrenceRule();
sendHappyBirthdayViaSMSRule.hour = 13;
sendHappyBirthdayViaSMSRule.minute = 00;
var j = schedule.scheduleJob("00 13 * * *", function () {
  sendHappyBirthdayViaSMS();
});

var sendHappyBirthdayViaEmailRule = new schedule.RecurrenceRule();
sendHappyBirthdayViaEmailRule.hour = 10;
sendHappyBirthdayViaEmailRule.minute = 35;
var j = schedule.scheduleJob("35 10 * * *", function () {
  sendHappyBirthdayViaEmail();
});

var checkLicenceExpiredRule = new schedule.RecurrenceRule();
checkLicenceExpiredRule.hour = 02;
checkLicenceExpiredRule.minute = 00;
var j = schedule.scheduleJob("00 02 * * *", function () {
  checkLicenceExpired();
});


/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => console.log(`API running on localhost:${port}`));
