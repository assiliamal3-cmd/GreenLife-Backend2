/* eslint-env node */

const nodemailer = require("nodemailer");

// ================= TRANSPORT =================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // IMPORTANT (STARTTLS)

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  tls: {
    rejectUnauthorized: false, // FIX erreur certificat
  },
});

// ================= VERIFY =================
transporter.verify((error) => {
  if (error) {
    console.error("❌ Email config error:", error);
  } else {
    console.log("✅ Serveur email prêt");
  }
});

// ================= SEND EMAIL =================
const sendEmail = async (to, subject, text, attachments = []) => {
  try {
    if (!to || !subject) {
      throw new Error("Email et sujet obligatoires");
    }

    const mailOptions = {
      from: `"GreenLife 🌱" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("📧 Email envoyé:", info.response);

    return info;
  } catch (error) {
    console.error("❌ Erreur envoi email:", error);
    throw error;
  }
};

module.exports = sendEmail;