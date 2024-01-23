require("dotenv").config();
const express = require("express");
const mysql = require("mysql");
var fs = require("fs");
var nodemailer = require("nodemailer");
var request = require("request");
const logger = require("./logger");
const sendSmsFromMail = require("./ftpUploadSMS");

var link = process.env.link_api;

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

function sendHappyBirthdayViaSMS() {
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
            // "SELECT distinct c.*, sb.* from customers c join sms_birthday_congratulation sb on c.storeId = sb.superadmin where DAY(c.birthday + interval 1 DAY) = DAY(CURRENT_DATE()) and MONTH(c.birthday) = MONTH(CURRENT_DATE())",
            "SELECT distinct c.*, sb.* from customers c join sms_birthday_congratulation sb on c.storeId = sb.superadmin where DAY(c.birthday  + interval 1 DAY) = DAY(CURRENT_DATE()) and MONTH(c.birthday) = MONTH(CURRENT_DATE()) and c.active = 1",
            function (err, rows, fields) {
              if (err) {
                console.error("SQL error:", err);
              }

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
                          if (mail.congratulationBirthday === 1) {
                            var phoneNumber = null;
                            if (mail.mobile) {
                              phoneNumber = mail.mobile;
                            }
                            if (
                              checkAvailableCode(phoneNumber, JSON.parse(codes))
                            ) {
                              var language = JSON.parse(body)["config"];
                              var message =
                                (mail.smsSubject
                                  ? mail.smsSubject
                                  : language.initialGreetingSMSReminder) +
                                " " +
                                mail.shortname +
                                ", \n \n" +
                                mail.smsMessage;
                              var signature = "";
                              if (mail.signatureAvailable) {
                                if (mail.smsSignatureCompanyName) {
                                  signature +=
                                    mail.smsSignatureCompanyName + "\n";
                                }
                                if (mail.smsSignatureAddress1) {
                                  signature += mail.smsSignatureAddress1 + "\n";
                                }
                                if (mail.smsSignatureAddress2) {
                                  signature += mail.smsSignatureAddress2 + "\n";
                                }
                                if (mail.smsSignatureAddress3) {
                                  signature += mail.smsSignatureAddress3 + "\n";
                                }
                                if (mail.smsSignatureTelephone) {
                                  signature +=
                                    mail.smsSignatureTelephone + " \n";
                                }
                                if (mail.smsSignatureMobile) {
                                  signature += mail.smsSignatureMobile + " \n";
                                }
                                if (mail.smsSignatureEmail) {
                                  signature += mail.smsSignatureEmail + " \n";
                                }
                              }

                              if (mail.smsSignatureWebsite) {
                                signature +=
                                  " \n" + mail.smsSignatureWebsite + "\n";
                              }

                              if (mail.smsSignaturePoweredBy) {
                                signature += mail.smsSignaturePoweredBy + " \n";
                              }

                              const fullMessage = message + "\n\n" + signature;
                              console.log(fullMessage);
                              sendSmsFromMail(phoneNumber, fullMessage);
                            }
                          } else {
                            conn.release();
                          }
                        }, sendMailTime);
                        sendMailTime += 500;
                      });
                    }, time);
                    time += 50000;
                  });
                }
              );
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
module.exports = sendHappyBirthdayViaSMS;
