const User = require("../models/User");
const Releve = require("../models/Releve");
const Consommation = require("../models/Consommation");
const calculateEcoScore = require("../utils/calculateEcoScore");

exports.getDashboard = async (req, res) => {
  try {
    // ================= GLOBAL STATS =================
    const [users, releves] = await Promise.all([
      User.countDocuments(),
      Releve.countDocuments(),
    ]);

    // ================= DATA =================
    const consommations = await Consommation.find({
      user: req.user.id,
    });

    let energie = 0;
    let eau = 0;
    let dechets = 0;
    let cout = 0;
    let tailleFoyer = 0;
    let appareilsList = [];
    const evolutionMap = {};

    consommations.forEach((item) => {
      if (!item || item.valeur == null) return;

      const valeur = Number(item.valeur) || 0;
      const date = new Date(item.date || item.createdAt);
      if (isNaN(date.getTime())) return;

      // totals
      if (item.type === "energie") energie += valeur;
      if (item.type === "eau") eau += valeur;
      if (item.type === "dechets") dechets += valeur;

      cout += Number(item.cout) || 0;

      if (item.tailleFoyer && Number(item.tailleFoyer) > tailleFoyer) {
        tailleFoyer = Number(item.tailleFoyer);
      }

      if (item.appareil) {
        appareilsList.push(
          ...item.appareil.split(",").map((a) => a.trim())
        );
      }

      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const label = date.toLocaleString("fr-FR", {
        month: "short",
        year: "numeric",
      });

      if (!evolutionMap[key]) {
        evolutionMap[key] = {
          name: label,
          energy: 0,
          water: 0,
          waste: 0,
        };
      }

      if (item.type === "energie") evolutionMap[key].energy += valeur;
      if (item.type === "eau") evolutionMap[key].water += valeur;
      if (item.type === "dechets") evolutionMap[key].waste += valeur;
    });

    const appareils = [...new Set(appareilsList)];

    const total = energie + eau + dechets;

    // ================= ECO SCORE =================
    const ecoData = await calculateEcoScore(req.user.id);

    let impactScore = Number(ecoData?.score ?? 75);
    if (!isFinite(impactScore)) impactScore = 75;

    impactScore = Math.max(0, Math.min(100, impactScore));

    // ================= RESPONSE =================
    return res.json({
      users,
      releves,

      energie: { value: Math.round(energie) },
      eau: { value: Math.round(eau) },
      dechets: { value: Math.round(dechets) },

      cout: Math.round(cout),
      total: Math.round(total),

      impact: {
        score: impactScore,
        co2: ecoData?.co2 ?? 0,
      },

      impactScore,

      evolution: Object.values(evolutionMap),

      tailleFoyer: Number(tailleFoyer) || 0,
      appareils,
    });

  } catch (error) {
    console.error("Dashboard error:", error);

    return res.status(500).json({
      message: "Erreur dashboard",
    });
  }
};