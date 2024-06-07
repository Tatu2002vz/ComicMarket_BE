const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");

const sendMail = asyncHandler(async ({ email, html, subject }) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: process.env.EMAIL_NAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // async..await is not allowed in global scope, must use a wrapper

  const info = await transporter.sendMail({
    from: '"ComicMarket 👻" <no-reply@truyentranh24h.com>', // sender address
    to: email, // list of receivers
    subject: subject, // Subject line
    text: "Hello world?", // plain text body
    html: html, // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
});

module.exports = { sendMail };
