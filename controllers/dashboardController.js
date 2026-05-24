const User = require("../models/User");
const Releve = require("../models/Releve");
const Notification = require("../models/Notification");
const Consommation = require("../models/Consommation");
const calculateEcoScore = require("../utils/calculateEcoScore");

// ======================================================
// GET DASHBOARD (FIXED + CLEAN)
// ======================================================
exports.getDashboard = async (req, res) => {
  try {
    // ================= GLOBAL STATS =================
    const [users, releves, notifications] = await Promise.all([
      User.countDocuments(),
      Releve.countDocuments(),
      Notification.countDocuments(),
    ]);

    // ================= CONSOMMATION =================
    const consommations = await Consommation.find({
      user: req.user.id,
    });

    let energie = 0;
    let eau = 0;
    let dechets = 0;
    let cout = 0;

    // ================= FOYER =================
    let tailleFoyer = 0;

    // ================= APPAREILS =================
    let appareilsList = [];

    // ================= EVOLUTION =================
    const evolutionMap = {};

    // ================= LOOP =================
    consommations.forEach((item) => {
      if (!item || item.valeur == null) return;

      const valeur = Number(item.valeur) || 0;

      const date = new Date(item.date || item.createdAt);

      if (isNaN(date.getTime())) return;

      // ================= TOTALS =================
      if (item.type === "energie") {
        energie += valeur;
      }

      if (item.type === "eau") {
        eau += valeur;
      }

      if (item.type === "dechets") {
        dechets += valeur;
      }

      // ================= COUT =================
      cout += Number(item.cout) || 0;

      // ================= TAILLE FOYER =================
      // prend la dernière valeur enregistrée
      if (
  item.tailleFoyer &&
  Number(item.tailleFoyer) > tailleFoyer
) {
  tailleFoyer = Number(item.tailleFoyer);
}

      // ================= APPAREILS =================
      if (item.appareil) {
        const split = item.appareil
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean);

        appareilsList.push(...split);
      }

      // ================= EVOLUTION =================
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      const monthLabel = date.toLocaleString("fr-FR", {
        month: "short",
        year: "numeric",
      });

      if (!evolutionMap[monthKey]) {
        evolutionMap[monthKey] = {
          name: monthLabel,
          energy: 0,
          water: 0,
          waste: 0,
        };
      }

      if (item.type === "energie") {
        evolutionMap[monthKey].energy += valeur;
      }

      if (item.type === "eau") {
        evolutionMap[monthKey].water += valeur;
      }

      if (item.type === "dechets") {
        evolutionMap[monthKey].waste += valeur;
      }
    });

    // ================= UNIQUE APPAREILS =================
    const appareils = [...new Set(appareilsList)];

    // ================= TOTAL =================
    const total = energie + eau + dechets;

    
  
// ================= SAFE VALUES =================
const safeEnergie = Number(energie) || 0;
const safeEau = Number(eau) || 0;
const safeDechets = Number(dechets) || 0;

// ================= CO2 =================
const co2 = safeEnergie * 0.5;

// ================= IMPACT SCORE =================
// ================= ECO SCORE =================
const ecoData = await calculateEcoScore(req.user.id);

let impactScore = ecoData?.score ?? 75;

if (!isFinite(impactScore)) {
  impactScore = 75;
}

impactScore = Math.max(0, Math.min(100, impactScore));

    // ================= IA =================
    let aiPrediction = "✅ Stable";

    if (energie > 500) {
      aiPrediction = "⚠️ Consommation énergétique élevée détectée";
    }

    if (eau > 300) {
      aiPrediction = "💧 Forte consommation d'eau détectée";
    }

    if (dechets > 100) {
      aiPrediction = "🗑️ Production élevée de déchets";
    }
    console.log("ENERGIE:", energie);
    console.log("EAU:", eau);
    console.log("DECHETS:", dechets);
    console.log("IMPACT:", impactScore); 

    // ================= RESPONSE =================
    return res.json({
      users,
      releves,
      notifications,

      energie: {
        value: Math.round(energie),
      },

      eau: {
        value: Math.round(eau),
      },

      dechets: {
        value: Math.round(dechets),
      },

      cout: Math.round(cout),

      total: Math.round(total),

    impact: {
  score: impactScore,
  co2: ecoData?.co2 ?? 0,
},
impactScore: impactScore,


      evolution: Object.values(evolutionMap),

      // ================= FOYER =================
      tailleFoyer: Number(tailleFoyer) || 0,

      // ================= APPAREILS =================
      appareils,

      // ================= IA =================
      aiPrediction,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return res.status(500).json({
      message: "Erreur dashboard",
    });
  }
};