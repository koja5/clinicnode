require("dotenv").config();
const express = require("express");
const router = express.Router();
var sha1 = require("sha1");
const axios = require("axios");
const API = "https://jsonplaceholder.typicode.com";
const mysql = require("mysql");
var fs = require("fs");
const path = require("path");
var nodemailer = require("nodemailer");
var hogan = require("hogan.js");
var request = require("request");
const logger = require("./logger");

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

function reminderViaEmail() {
  connection.getConnection(function (err, conn, res) {
    if (err) {
      res.json({
        code: 100,
        status: "Error in connection database",
      });
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
            "SELECT distinct c.email as 'customer_mail', c.shortname, s.storename, s.*, s.place as store_place, t.start, t.end, us.firstname, us.lastname, th.therapies_title, mr.*, e.allowSendInformation FROM reminder r join tasks t on r.superadmin = t.superadmin join customers c on t.customer_id = c.id join store s on t.storeId = s.id join users us on t.creator_id = us.id join therapy th on t.therapy_id = th.id join mail_reminder_message mr on r.superadmin = mr.superadmin join event_category e on t.colorTask = e.id where c.reminderViaEmail = 1 and r.email = 1 and CAST(t.start AS DATE) = CAST((NOW() + interval 2 DAY) as DATE) and e.allowSendInformation = 1 and c.active",
            function (err, rows, fields) {
              conn.release();
              if (err) {
                logger.log("error", err);
              }

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
                      if (mail.email !== null) {
                        var convertToDateStart = new Date(mail.start);
                        var convertToDateEnd = new Date(mail.end);
                        var startHours = convertToDateStart.getHours();
                        var startMinutes = convertToDateStart.getMinutes();
                        var endHours = convertToDateEnd.getHours();
                        var endMinutes = convertToDateEnd.getMinutes();
                        var date =
                          convertToDateStart.getDate() +
                          "." +
                          (convertToDateStart.getMonth() + 1) +
                          "." +
                          convertToDateStart.getFullYear();
                        var day = convertToDateStart.getDate();
                        var month = monthNames[convertToDateStart.getMonth()];
                        var start =
                          (startHours < 10 ? "0" + startHours : startHours) +
                          ":" +
                          (startMinutes < 10
                            ? "0" + startMinutes
                            : startMinutes);
                        var end =
                          (endHours < 10 ? "0" + endHours : endHours) +
                          ":" +
                          (endMinutes < 10 ? "0" + endMinutes : endMinutes);
                        var language = JSON.parse(body)["config"];
                        var signatureAvailable = false;
                        if (mail.signatureAvailable) {
                          signatureAvailable = true;
                        }
                        var mailOptions = {
                          from:
                            process.env.smtp_name + " " + process.env.smtp_user,
                          subject: mail.mailSubject
                            ? mail.mailSubject
                            : language.subjectForReminderReservation,
                          html: compiledTemplate.render({
                            initialGreeting: mail.initialGreeting
                              ? mail.initialGreeting
                              : language.initialGreeting,
                            introductoryMessageForReminderReservation:
                              mail.mailMessage
                                ? mail.mailMessage
                                : language.introductoryMessageForReminderReservation,
                            dateMessage: mail.mailDate
                              ? mail.mailDate
                              : language.dateMessage,
                            timeMessage: mail.mailTime
                              ? mail.mailTime
                              : language.timeMessage,
                            therapyMessage: mail.mailTherapy
                              ? mail.mailTherapy
                              : language.therapyMessage,
                            doctorMessage: mail.mailDoctor
                              ? mail.mailDoctor
                              : language.doctorMessage,
                            storeLocation: mail.mailClinic
                              ? mail.mailClinic
                              : language.storeLocation,
                            finalGreeting: mail.mailFinalGreeting
                              ? mail.mailFinalGreeting
                              : language.finalGreeting,
                            signature: mail.mailSignature
                              ? mail.mailSignature
                              : language.signature,
                            thanksForUsing: mail.mailThanksForUsing
                              ? mail.mailThanksForUsing
                              : language.thanksForUsing,
                            websiteLink: language.websiteLink,
                            ifYouHaveQuestion: mail.mailIfYouHaveQuestion
                              ? mail.mailIfYouHaveQuestion
                              : language.ifYouHaveQuestion,
                            notReply: mail.mailNotReply
                              ? mail.mailNotReply
                              : language.notReply,
                            copyRight: mail.mailCopyRight
                              ? mail.mailCopyRight
                              : language.copyRight,
                            firstName: mail.shortname,
                            date: date,
                            start: start,
                            end: end,
                            storename: mail.storename,
                            therapy: mail.therapies_title,
                            doctor: mail.lastname + " " + mail.firstname,
                            month: month,
                            day: day,
                            signatureAddress:
                              signatureAvailable &&
                              mail.signatureAddress &&
                              (mail.street || mail.zipcode || mail.store_place)
                                ? mail.signatureAddress +
                                  "\n" +
                                  mail.street +
                                  "\n" +
                                  mail.zipcode +
                                  " " +
                                  mail.store_place
                                : "",
                            signatureTelephone:
                              signatureAvailable &&
                              mail.signatureTelephone &&
                              mail.telephone
                                ? mail.signatureTelephone + " " + mail.telephone
                                : "",
                            signatureMobile:
                              signatureAvailable &&
                              mail.signatureMobile &&
                              mail.mobile
                                ? mail.signatureMobile + " " + mail.mobile
                                : "",
                            signatureEmail:
                              signatureAvailable &&
                              mail.signatureEmail &&
                              mail.email
                                ? mail.signatureEmail + " " + mail.email
                                : "",
                          }),
                        };

                        mailOptions.to = mail.customer_mail;
                        console.log(mailOptions);
                        smtpTransport.sendMail(
                          mailOptions,
                          function (error, response) {
                            console.log(response);
                            if (error) {
                              logger.log(
                                "error",
                                `Error to sent automate EMAIL REMINDER to EMAIL: ${mail.email}. Error: ${error}`
                              );
                            } else {
                              logger.log(
                                "info",
                                `Success sent automate EMAIL REMINDER to EMAIL: ${mail.email}.`
                              );
                            }
                          }
                        );
                      }
                    }, sendMailTime);
                    sendMailTime += 500;
                  });
                }, time);
                time += 70000;
              });
            }
          );
        }
      }
    );
  });
}

module.exports = reminderViaEmail;
