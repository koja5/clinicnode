require("dotenv").config();
var express = require("express");
var nodemailer = require("nodemailer");
var router = express.Router();
var hogan = require("hogan.js");
var fs = require("fs");

var smtpTransport = nodemailer.createTransport({
  host: process.env.smtp_host,
  port: process.env.smtp_port,
  tls: {
    rejectUnauthorized: process.env.smtp_rejectUnauthorized,
  },
  auth: {
    user: process.env.smtp_user,
    pass: process.env.smtp_pass,
  },
});

/*var smtpTransport = nodemailer.createTransport({
  host: "116.203.109.78",
  port: 25,
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
  auth: {
    user: "info@clinicnode.com",
    pass: "!91y^ODGp7w#",
  },
});*/

router.post("/sendMail", function (req, res) {
  var confirmTemplate = fs.readFileSync(
    "./routes/templates/" + req.body.template,
    "utf-8"
  );
  var compiledTemplate = hogan.compile(confirmTemplate);
  var mailOptions = {
    from: req.body.sender
      ? '"' + req.body.sender + '"' + process.env.smtp_user
      : process.env.smtp_name + " " + process.env.smtp_user,
    to: process.env.admin_email,
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
