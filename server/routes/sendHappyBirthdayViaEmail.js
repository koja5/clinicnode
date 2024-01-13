require("dotenv").config();
const mysql = require("mysql");
var fs = require("fs");
var nodemailer = require("nodemailer");
const logger = require("./logger");
var hogan = require("hogan.js");
var request = require("request");

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

function sendHappyBirthdayViaEmail() {
  var mailTemplate = fs.readFileSync(
    "./routes/templates/mailBirthdayCongratulation.hjs",
    "utf-8"
  );
  var mailRender = hogan.compile(mailTemplate);

  connection.getConnection(function (err, conn) {
    request(
      {
        rejectUnauthorized: false,
        url: link + "/getTranslationByCountryCode/AT",
      },
      function (error, res, body) {
        if (!error && res.statusCode === 200) {
          conn.query(
            /*"SELECT distinct c.*, mb.* from customers c join mail_birthday_congratulation mb on c.storeId = mb.superadmin where DAY(c.birthday + interval 1 DAY) = DAY(CURRENT_DATE()) and MONTH(c.birthday) = MONTH(CURRENT_DATE())",*/
            "SELECT distinct c.*, mb.* from customers c join mail_birthday_congratulation mb on c.storeId = mb.superadmin where DAY(c.birthday + interval 1 DAY) = DAY(CURRENT_DATE()) and MONTH(c.birthday) = MONTH(CURRENT_DATE()) and c.active = 1",
            function (err, rows) {
              if (err) {
                logger.log("error", err);
              }
              var language = JSON.parse(body)["config"];

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
                      if (mail.congratulationBirthday) {
                        var signatureAvailable = false;
                        if (mail.signatureAvailable) {
                          signatureAvailable = true;
                        }
                        var mailOptions = {
                          from:
                            process.env.smtp_name + " " + process.env.smtp_user,
                          to: mail.email,
                          subject: mail.mailSubject
                            ? mail.mailSubject
                            : language.mailSubject,
                          html: mailRender.render({
                            firstName: mail.shortname,
                            message: mail.message,
                            initialGreeting: mail.mailInitialGreeting
                              ? mail.mailInitialGreeting
                              : language.initialGreeting,
                            finalGreeting: mail.mailFinalGreeting
                              ? mail.mailFinalGreeting
                              : language.finalGreeting,
                            signature: !signatureAvailable
                              ? signatureAvailable
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
                            message: mail.mailMessage ? mail.mailMessage : "",
                            signature: mail.mailSignature
                              ? mail.mailSignature
                              : "",
                            signatureCompanyName:
                              signatureAvailable && mail.signatureCompanyName
                                ? mail.signatureCompanyName
                                : "",
                            signatureAddress1:
                              signatureAvailable && mail.signatureAddress1
                                ? mail.signatureAddress1
                                : "",
                            signatureAddress2:
                              signatureAvailable && mail.signatureAddress2
                                ? mail.signatureAddress2
                                : "",
                            signatureAddress3:
                              signatureAvailable && mail.signatureAddress3
                                ? mail.signatureAddress3
                                : "",
                            signatureTelephone:
                              signatureAvailable && mail.signatureTelephone
                                ? mail.signatureTelephone
                                : "",
                            signatureMobile:
                              signatureAvailable && mail.signatureMobile
                                ? mail.signatureMobile
                                : "",
                            signatureEmail:
                              signatureAvailable && mail.signatureEmail
                                ? mail.signatureEmail
                                : "",
                          }),
                        };
                        console.log(mailOptions);
                        // smtpTransport.sendMail(
                        //   mailOptions,
                        //   function (error, response) {
                        //     if (error) {
                        //       logger.log("error", error);
                        //     } else {
                        //       logger.log(
                        //         "info",
                        //         `Sent mail for celebrate birthday on EMAIL: ${mail.email}`
                        //       );
                        //     }
                        //   }
                        // );
                      }
                    }, sendMailTime);
                    sendMailTime += 500;
                  });
                }, time);
                time += 50000;
              });
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
module.exports = sendHappyBirthdayViaEmail;
