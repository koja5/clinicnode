require("dotenv").config();
const ftp = require("basic-ftp");
const fs = require("fs");
const path = require("path");
var nodemailer = require("nodemailer");
const logger = require("./logger");

var smtpTransport = nodemailer.createTransport({
  host: process.env.smtp_host,
  port: process.env.smtp_port,
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

async function sendSMSFromMail(phoneNumber, message) {
  var mailOptions = {
    from: process.env.smtp_name + " " + process.env.smtp_user,
    to: "eu8tbwjyvysz36a@tuina.co.at",
    subject: phoneNumber,
    text: message,
  };
  smtpTransport.sendMail(mailOptions, function (error, response) {
    console.log(response);
    if (error) {
      console.log(error);
    } else {
      console.log("send!");
    }
  });
}

// async function ftpUploadSMS(pathFile, fileName) {
//   const client = new ftp.Client();
//   client.ftp.verbose = true;
//   try {
//     await client.access({
//       host: FTPAccessData.host,
//       port: FTPAccessData.port,
//       user: FTPAccessData.user,
//       password: FTPAccessData.password,
//     });
//     await client.ensureDir("smsupload");
//     await client.uploadFrom(pathFile, fileName);
//     fs.unlink(path.join("server/sms/", fileName), (err) => {
//       if (err) throw err;
//     });
//   } catch (err) {
//     console.log(err);
//   }
//   client.close();
// }

module.exports = sendSMSFromMail;
