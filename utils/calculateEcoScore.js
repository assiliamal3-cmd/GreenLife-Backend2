const Consommation = require("../models/Consommation");
const User = require("../models/User");

const calculateEcoScore = async (userId) => {
  const data = await Consommation.find({ user: userId });

  let energie = 0;
  let eau = 0;
  let dechets = 0;

  data.forEach((c) => {
    const valeur = Number(c.valeur) || 0;

    if (c.type === "energie") energie += valeur;
    if (c.type === "eau") eau += valeur;
    if (c.type === "dechets") dechets += valeur;
  });

  // ================= UNIQUE FORMULA =================
  let score =
    100 -
    energie * 0.002 -
    eau * 0.001 -
    dechets * 0.01;

  score = Math.max(0, Math.min(100, Math.round(score)));

  // update user
  await User.findByIdAndUpdate(userId, {
    ecoScore: score,
  });

  return {
    score,
    energie,
    eau,
    dechets,
  };
};

module.exports = calculateEcoScore;