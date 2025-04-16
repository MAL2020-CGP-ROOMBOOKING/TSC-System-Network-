const nodemailer = require("nodemailer");
require("dotenv").config();

// Configure the transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // or another email provider/SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Updated Send Email Function
const sendEmail = async (to, subject, htmlMessage, textFallback = "") => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      // Pass your HTML content here
      html: htmlMessage,
      // Optionally include a plain-text fallback (recommended)
      text: textFallback || "This is the text fallback for email clients that do not support HTML.",
    });

    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error("❌ Email failed to send:", error);
  }
};

module.exports = sendEmail;
