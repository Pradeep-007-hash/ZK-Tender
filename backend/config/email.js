const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER || "sales@tenderdetail.com",
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS || "snmg xnar sefy khag",
  },
});

module.exports = transporter;
