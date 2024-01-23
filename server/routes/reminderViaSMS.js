require("dotenv").config();
const express = require("express");
const router = express.Router();
var sha1 = require("sha1");
const axios = require("axios");
const API = "https://jsonplaceholder.typicode.com";
const mysql = require("mysql");
var fs = require("fs");
var nodemailer = require("nodemailer");
var hogan = require("hogan.js");
var request = require("request");
const logger = require("./logger");
const sendSmsFromMail = require("./ftpUploadSMS");

var link = process.env.link_api;
var reminderTemplate = fs.readFileSync(
  "../server/routes/templates/reminderForReservation.hjs",
  "utf-8"
);
var compiledTemplate = hogan.compile(reminderTemplate);
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

var connection = mysql.createPool({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
});

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

function reminderViaSMS() {
  connection.getConnection(function (err, conn) {
    if (err) {
      console.log(err);
      return;
    }
    request(
      {
        rejectUnauthorized: false,
        url: link + "/getTranslationByCountryCode/AT",
      },
      function (error, response, body) {
        if (!error && response.statusCode === 200) {
          conn.query(
            "SELECT distinct r.sms, c.telephone, c.mobile, c.shortname, s.storename, s.street, s.zipcode, s.place, s.telephone as storeTelephone, s.mobile as storeMobile, s.email, t.start, t.end, us.firstname, us.lastname, th.therapies_title, sr.*, e.allowSendInformation FROM reminder r join tasks t on r.superadmin = t.superadmin join customers c on t.customer_id = c.id join store s on t.storeId = s.id join users us on t.creator_id = us.id join therapy th on t.therapy_id = th.id join sms_reminder_message sr on r.superadmin = sr.superadmin join event_category e on t.colorTask = e.id where c.reminderViaSMS = 1 and r.sms = 1 and CAST(t.start AS DATE) = CAST((NOW() + interval 1 DAY) as DATE) and e.allowSendInformation = 1 and c.active = 1",
            function (err, rows, fields) {
              if (err) {
                console.error("SQL error:", err);
              }
              if (rows.length > 0) {
                request(
                  {
                    rejectUnauthorized: false,
                    url: link + "/getAvailableAreaCode",
                  },
                  function (error, response, codes) {
                    var spliceMails = [];
                    while (rows.length > 0) {
                      spliceMails.push(rows.splice(0, 70));
                    }

                    var time = 0;
                    spliceMails.forEach(function (mails, i, array) {
                      setTimeout(() => {
                        var sendMailTime = 1000;
                        mails.forEach(function (mail, i, array) {
                          setTimeout(() => {
                            if (mail.sms !== null && mail.sms === 1) {
                              var phoneNumber = null;
                              if (mail.telephone) {
                                phoneNumber = mail.telephone;
                              } else if (mail.mobile) {
                                phoneNumber = mail.mobile;
                              }
                              if (
                                checkAvailableCode(
                                  phoneNumber,
                                  JSON.parse(codes)
                                )
                              ) {
                                var signature = "";
                                var dateMessage = "";
                                var time = "";
                                var clinic = "";
                                var language = JSON.parse(body)["config"];
                                if (mail.signatureAvailable) {
                                  if (
                                    (mail.street ||
                                      mail.zipcode ||
                                      mail.place) &&
                                    mail.smsSignatureAddress
                                  ) {
                                    signature +=
                                      mail.smsSignatureAddress +
                                      " \n" +
                                      mail.street +
                                      " \n" +
                                      mail.zipcode +
                                      " " +
                                      mail.place +
                                      "\n";
                                  }
                                  if (
                                    mail.storeTelephone &&
                                    mail.smsSignatureTelephone
                                  ) {
                                    signature +=
                                      mail.smsSignatureTelephone +
                                      " " +
                                      mail.storeTelephone +
                                      " \n";
                                  }
                                  if (
                                    mail.storeMobile &&
                                    mail.smsSignatureMobile
                                  ) {
                                    signature +=
                                      mail.smsSignatureMobile +
                                      " " +
                                      mail.storeMobile +
                                      " \n";
                                  }
                                  if (mail.email && mail.smsSignatureEmail) {
                                    signature +=
                                      mail.smsSignatureEmail +
                                      " " +
                                      mail.email +
                                      " \n";
                                  }
                                }

                                if (mail.smsSignatureWebsite) {
                                  signature += " \n" + mail.smsSignatureWebsite;
                                }

                                if (language.smsSignaturePoweredBy) {
                                  signature +=
                                    language.smsSignaturePoweredBy + " \n";
                                }

                                var convertToDateStart = new Date(mail.start);
                                var convertToDateEnd = new Date(mail.end);
                                var startHours = convertToDateStart.getHours();
                                var startMinutes =
                                  convertToDateStart.getMinutes();
                                var endHours = convertToDateEnd.getHours();
                                var endMinutes = convertToDateEnd.getMinutes();
                                var date =
                                  convertToDateStart.getDate() +
                                  "." +
                                  (convertToDateStart.getMonth() + 1) +
                                  "." +
                                  convertToDateStart.getFullYear();
                                var day = convertToDateStart.getDate();
                                var month =
                                  monthNames[convertToDateStart.getMonth()];
                                var start =
                                  (startHours < 10
                                    ? "0" + startHours
                                    : startHours) +
                                  ":" +
                                  (startMinutes < 10
                                    ? "0" + startMinutes
                                    : startMinutes);
                                var end =
                                  (endHours < 10 ? "0" + endHours : endHours) +
                                  ":" +
                                  (endMinutes < 10
                                    ? "0" + endMinutes
                                    : endMinutes);

                                if (mail.smsDate) {
                                  dateMessage =
                                    mail.smsDate + " " + date + " \n";
                                }
                                if (mail.smsTime) {
                                  time =
                                    mail.smsTime +
                                    " " +
                                    start +
                                    "-" +
                                    end +
                                    " \n";
                                }
                                if (mail.smsClinic) {
                                  clinic =
                                    mail.smsClinic +
                                    " " +
                                    mail.storename +
                                    " \n\n";
                                }

                                var message =
                                  (mail.smsSubject
                                    ? mail.smsSubject
                                    : language.initialGreetingSMSReminder) +
                                  " " +
                                  mail.shortname +
                                  ", \n" +
                                  "\n" +
                                  (mail.smsMessage
                                    ? mail.smsMessage
                                    : language.introductoryMessageForSMSReminderReservation) +
                                  " \n" +
                                  "\n" +
                                  dateMessage +
                                  time +
                                  clinic;
                                var content =
                                  "To: " +
                                  phoneNumber +
                                  "\r\n\r\n" +
                                  message +
                                  "\r\n" +
                                  signature;
                                const fullMessage =
                                  message + "\r\n" + signature;
                                sendSmsFromMail(phoneNumber, fullMessage);
                              }
                            }
                          }, sendMailTime);
                          sendMailTime += 1000;
                        });
                      }, time);
                      time += 70000;
                    });
                  }
                );
              }
              conn.release();
            }
          );
        }
      }
    );
  });
}

function checkAvailableCode(phone, codes) {
  for (let i = 0; i < codes.length; i++) {
    if (phone && phone.startsWith(codes[i].area_code)) {
      return true;
    }
  }
  return false;
}
module.exports = reminderViaSMS;
