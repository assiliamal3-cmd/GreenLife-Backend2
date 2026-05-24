const cron = require("node-cron");
const User = require("../models/User");
const sendEmail = require("../services/emailService");
const generatePDF = require("../services/pdfService");

// 🕐 Tous les 1er du mois à 08h
cron.schedule("0 8 1 * *", async () => {
  console.log("⏰ Génération automatique des rapports");

  const users = await User.find();

  for (let user of users) {
    // ⚠️ ici tu peux récupérer ses données comme avant
    const data = {
      energie: 100,
      eau: 50,
      dechets: 20,
      co2: 50,
      economies: 100,
      arbres: 2,
    };

    const filePath = await generatePDF(data, `rapport-${user._id}.pdf`);

    await sendEmail(
      user.email,
      "📊 Rapport mensuel GreenLife",
      "Votre rapport automatique 🌱",
      [{ filename: "rapport.pdf", path: filePath }]
    );
  }
});