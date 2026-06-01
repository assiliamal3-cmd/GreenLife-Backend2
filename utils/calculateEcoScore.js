// utils/calculateEcoScore.js

const Consommation = require("../models/Consommation");
const User = require("../models/User");

const calculateEcoScore = async (userId) => {
  const consommations = await Consommation.find({
    user: userId,
  });

  if (!consommations.length) {
    await User.findByIdAndUpdate(userId, {
      ecoScore: 100,
    });

    return {
      score: 100,
      energie: 0,
      eau: 0,
      dechets: 0,
    };
  }

  // ================= TOTAUX =================

  let energieTotal = 0;
  let eauTotal = 0;
  let dechetsTotal = 0;

  let energieCount = 0;
  let eauCount = 0;
  let dechetsCount = 0;

  let tailleFoyer = 1;

  consommations.forEach((c) => {
    const valeur = Number(c.valeur) || 0;

    if (c.tailleFoyer) {
      tailleFoyer = Number(c.tailleFoyer);
    }

    if (c.type === "energie") {
      energieTotal += valeur;
      energieCount++;
    }

    if (c.type === "eau") {
      eauTotal += valeur;
      eauCount++;
    }

    if (c.type === "dechets") {
      dechetsTotal += valeur;
      dechetsCount++;
    }
  });

  // ================= MOYENNES =================

  const energie =
    energieCount > 0
      ? energieTotal / energieCount
      : 0;

  const eau =
    eauCount > 0
      ? eauTotal / eauCount
      : 0;

  const dechets =
    dechetsCount > 0
      ? dechetsTotal / dechetsCount
      : 0;

  // ================= AJUSTEMENT FOYER =================

  const energieParPersonne =
    energie / Math.max(1, tailleFoyer);

  const eauParPersonne =
    eau / Math.max(1, tailleFoyer);

  const dechetsParPersonne =
    dechets / Math.max(1, tailleFoyer);

  // ================= ECO SCORE =================

  let score =
    100 -
    energieParPersonne * 0.05 -
    eauParPersonne * 0.5 -
    dechetsParPersonne * 1.5;

  score = Math.round(score);

  score = Math.max(
    0,
    Math.min(100, score)
  );

  // ================= UPDATE USER =================

  await User.findByIdAndUpdate(userId, {
    ecoScore: score,
  });

  return {
    score,
    energie: Number(
      energie.toFixed(2)
    ),
    eau: Number(
      eau.toFixed(2)
    ),
    dechets: Number(
      dechets.toFixed(2)
    ),
    tailleFoyer,
  };
};

module.exports = calculateEcoScore;