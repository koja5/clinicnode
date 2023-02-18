require("dotenv").config();
var express = require("express");
var nodemailer = require("nodemailer");
var router = express.Router();
var hogan = require("hogan.js");
var fs = require("fs");

var smtpTransport = nodemailer.createTransport({
  host: process.env.smtp_host,
  port: process.env.smtp_port,
  secure: process.env.smtp_secure,
  tls: {
    rejectUnauthorized: process.env.smtp_rejectUnauthorized,
  },
  debug: true,
  ssl: true,
  auth: {
    user: process.env.smtp_user,
    pass: process.env.smtp_pass,
  },
});

router.post("/sendMail", function (req, res) {
  var confirmTemplate = fs.readFileSync(
    "./routes/templates/" + req.body.template,
    "utf-8"
  );
  var compiledTemplate = hogan.compile(confirmTemplate);
  var mailOptions = {
    from: req.body.sender
      ? '"' + req.body.sender + '"' + process.env.smtp_user
      : '"KidsNode"' + process.env.smtp_user,
    to: "kojaaa95@gmail.com",
    subject: req.body.subject,
    html: compiledTemplate.render(req.body.fields),
  };

  smtpTransport.sendMail(mailOptions, function (error, response) {
    if (error) {
      // res.end(false);
    } else {
      // res.end(true);
    }
  });
});

module.exports = router;
