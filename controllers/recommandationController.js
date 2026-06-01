const Consommation = require("../models/Consommation");
const axios = require("axios");
const calculateEcoScore = require("../utils/calculateEcoScore");
// ======================================================
// CACHE
// ======================================================
const cache = {};
const CACHE_DURATION = 10 * 60 * 1000;

// ======================================================
// SAFE NUMBER (ROBUSTE)
// ======================================================
const safeNumber = (v) => {
  if (!v) return 0;
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

// ======================================================
// NORMALIZE TYPE
// ======================================================
const normalize = (t) =>
  t?.toLowerCase().trim();

// ======================================================
// SCORE ECO
// ======================================================


// ======================================================
// NIVEAU
// ======================================================
const getEcoLevel = (score) => {
  if (score >= 80) return "Expert 🌱";
  if (score >= 50) return "Avancé 👍";
  if (score >= 25) return "Moyen ⚠️";
  return "Critique 🔴";
};

// ======================================================
// TREND
// ======================================================
const calculateMonthlyTrend = (current, previous) => {
  if (!previous) return 0;
  return Math.round(((current - previous) / previous) * 100);
};

// ======================================================
// PREVIOUS MONTH DATA
// ======================================================
const getPreviousMonthData = async (userId) => {
  const now = new Date();

  const startCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
  const startPrevious = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endPrevious = new Date(now.getFullYear(), now.getMonth(), 0);

  const current = await Consommation.find({
    user: userId,
    createdAt: { $gte: startCurrent },
  });

  const previous = await Consommation.find({
    user: userId,
    createdAt: { $gte: startPrevious, $lte: endPrevious },
  });

  const sum = (arr, type) =>
    arr
      .filter((i) => normalize(i.type) === type)
      .reduce((a, b) => a + safeNumber(b.valeur), 0);

  return {
    energie: calculateMonthlyTrend(sum(current, "energie"), sum(previous, "energie")),
    eau: calculateMonthlyTrend(sum(current, "eau"), sum(previous, "eau")),
    dechets: calculateMonthlyTrend(sum(current, "dechets"), sum(previous, "dechets")),
  };
};

// ======================================================
// 🤖 LLAMA3 AI
// ======================================================
const generateAIRecommendations = async ({
  energie,
  eau,
  dechets,
  score,
  trends,
}) => {
  try {
   const prompt = `
SYSTEM:
Tu es une IA écologique française.

RÈGLES STRICTES:
- Langue: FRANÇAIS UNIQUEMENT
- Aucune exception
- JSON uniquement
- pas de texte hors JSON

UTILISATEUR:
Analyse écologique:

Énergie: ${energie}
Eau: ${eau}
Déchets: ${dechets}
Score: ${score}

Tendances:
énergie: ${trends.energie}%
eau: ${trends.eau}%
déchets: ${trends.dechets}%

Réponds uniquement JSON:
{
  "recommendations": [
    {
      "title": "",
      "description": "",
      "priority": "high|medium|low"
    }
  ]
}
`;

    const res = await axios.post("http://localhost:11434/api/chat", {
      model: "llama3:8b",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: false,
    });

    const text = res.data.message.content;

    const match = text.match(/\{[\s\S]*\}/);

    if (!match) throw new Error("JSON invalide IA");

    const json = JSON.parse(match[0]);

    return json.recommendations || [];
  } catch (err) {
    console.error("LLAMA3 ERROR:", err);

    return [
      {
        title: "Réduire consommation globale",
        description: "Optimisez votre consommation énergétique quotidienne.",
        priority: "medium",
      },
      {
        title: "Surveiller l'eau",
        description: "Réduisez les gaspillages d’eau inutiles.",
        priority: "medium",
      },
      {
        title: "Tri des déchets",
        description: "Améliorez le recyclage et le tri sélectif.",
        priority: "low",
      },
    ];
  }
};

// ======================================================
// CONTROLLER
// ======================================================
exports.getAIRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    // CACHE
    if (cache[userId]) {
      return res.json({
        success: true,
        ...cache[userId],
        cached: true,
      });
    }

    // DATA
    const data = await Consommation.find({ user: userId });

    if (!data.length) {
      return res.json({
        success: true,
        score: 100,
        niveau: "Expert 🌱",
        economie: 0,
        recommendations: [
          {
            title: "Aucune donnée",
            description: "Ajoutez vos consommations pour analyse IA.",
            priority: "low",
          },
        ],
      });
    }

    // INIT
    let energie = 0;
    let eau = 0;
    let dechets = 0;

    // CLEAN DATA
    data.forEach((d) => {
      const type = normalize(d.type);
      const v = safeNumber(d.valeur);

      if (type === "energie" || type === "electricite") energie += v;
      if (type === "eau") eau += v;
      if (type === "dechets" || type === "dechet") dechets += v;
    });

    // SCORE
    const ecoData = await calculateEcoScore(userId);

const score = ecoData.score;

energie = ecoData.energie;
eau = ecoData.eau;
dechets = ecoData.dechets;

const niveau = getEcoLevel(score);

    // TRENDS
    const trends = await getPreviousMonthData(userId);

    // IA
    const recommendations = await generateAIRecommendations({
      energie,
      eau,
      dechets,
      score,
      trends,
    });

    // ECONOMIE
    const economie = Math.round(
      (energie * 0.12 + eau * 0.1 + dechets * 0.06) / 10
    );

    const response = {
      success: true,
      score,
      niveau,
      economie,
      consommation: { energie, eau, dechets },
      trends,
      recommendations,
      generatedAt: new Date(),
    };

    // CACHE
    cache[userId] = response;

    setTimeout(() => {
      delete cache[userId];
    }, CACHE_DURATION);

    return res.json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Erreur IA GreenLife",
    });
  }
};