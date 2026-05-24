const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  try {

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,

      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },

      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"GreenLife" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email envoyé à:", to);

  } catch (err) {

    console.error("❌ ERREUR EMAIL:", err);

    throw err;
  }
};

module.exports = sendEmail;