const Consommation = require("../models/Consommation");

// ======================================================
// CACHE
// ======================================================
const cache = {};
const CACHE_DURATION = 10 * 60 * 1000;

// ======================================================
// LIMITES INTELLIGENTES
// ======================================================
const LIMITS = {
  energie: {
    medium: 350,
    high: 500,
  },

  eau: {
    medium: 200,
    high: 350,
  },

  dechets: {
    medium: 80,
    high: 150,
  },
};

// ======================================================
// HELPERS
// ======================================================
const safeNumber = (v) =>
  isNaN(Number(v)) ? 0 : Number(v);

// ======================================================
// SCORE GLOBAL COMMUN
// IMPORTANT → UTILISÉ PARTOUT
// ======================================================
const calculateEcoScore = (
  energie,
  eau,
  dechets
) => {
  // CO2
  const co2 =
    energie * 0.233 +
    eau * 0.344 +
    dechets * 0.9;

  // SCORE
  let score = 100;

  score -= energie * 0.01;
  score -= eau * 0.03;
  score -= dechets * 0.1;
  score -= co2 * 0.02;

  // BONUS
  const total =
    energie + eau + dechets;

  if (total < 300) {
    score += 5;
  }

  score = Math.max(
    0,
    Math.min(100, Math.round(score))
  );

  return score;
};

// ======================================================
// NIVEAU ECO
// ======================================================
const getEcoLevel = (score) => {
  if (score >= 80) {
    return "Expert 🌱";
  }

  if (score >= 50) {
    return "Avancé 👍";
  }

  if (score >= 25) {
    return "Moyen ⚠️";
  }

  return "Critique 🔴";
};

// ======================================================
// TREND
// ======================================================
const calculateMonthlyTrend = (
  current,
  previous
) => {
  if (!previous || previous === 0) {
    return 0;
  }

  return Math.round(
    ((current - previous) / previous) *
      100
  );
};

// ======================================================
// SEVERITY
// ======================================================
const severityScore = (
  value,
  type
) => {
  const limit = LIMITS[type];

  if (!limit) return 0;

  if (value > limit.high) {
    return 3;
  }

  if (value > limit.medium) {
    return 2;
  }

  return 1;
};

// ======================================================
// TREND DATA
// ======================================================
const getPreviousMonthData =
  async (userId) => {
    const now = new Date();

    const startCurrent =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

    const startPrevious =
      new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );

    const endPrevious =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        0
      );

    const current =
      await Consommation.find({
        user: userId,
        createdAt: {
          $gte: startCurrent,
        },
      });

    const previous =
      await Consommation.find({
        user: userId,
        createdAt: {
          $gte: startPrevious,
          $lte: endPrevious,
        },
      });

    const sum = (arr, type) =>
      arr
        .filter(
          (i) => i.type === type
        )
        .reduce(
          (a, b) =>
            a +
            safeNumber(
              b.valeur
            ),
          0
        );

    return {
      energie:
        calculateMonthlyTrend(
          sum(current, "energie"),
          sum(previous, "energie")
        ),

      eau:
        calculateMonthlyTrend(
          sum(current, "eau"),
          sum(previous, "eau")
        ),

      dechets:
        calculateMonthlyTrend(
          sum(current, "dechets"),
          sum(previous, "dechets")
        ),
    };
  };

// ======================================================
// IA RECOMMANDATIONS
// ======================================================
const generateRecommendations =
  ({
    energie,
    eau,
    dechets,
    score,
    trends,
  }) => {
    let rec = [];

    const add = (item) => {
      rec.push({
        ...item,

        weight:
          (item.priority ===
          "high"
            ? 3
            : item.priority ===
              "medium"
            ? 2
            : 1) +
          (item.trendBoost ||
            0),
      });
    };

    // ======================================================
    // ENERGIE
    // ======================================================

    const energySeverity =
      severityScore(
        energie,
        "energie"
      );

    if (energySeverity === 3) {
      add({
        category:
          "energie",

        title:
          "Surconsommation énergétique critique",

        description:
          "Votre consommation électrique est très élevée.",

        actions: [
          "Éteindre les appareils inutilisés",
          "Installer des LED",
          "Limiter la climatisation",
          "Utiliser des appareils basse consommation",
        ],

        priority: "high",

        icon: "⚡",

        trendBoost:
          trends.energie > 20
            ? 2
            : 0,
      });
    } else if (
      energySeverity === 2
    ) {
      add({
        category:
          "energie",

        title:
          "Optimisation énergétique recommandée",

        description:
          "Votre consommation peut être améliorée.",

        actions: [
          "Réduire la veille",
          "Mode économie",
        ],

        priority:
          "medium",

        icon: "💡",
      });
    }

    // ======================================================
    // EAU
    // ======================================================

    const waterSeverity =
      severityScore(
        eau,
        "eau"
      );

    if (waterSeverity === 3) {
      add({
        category: "eau",

        title:
          "Consommation d'eau excessive",

        description:
          "Votre usage d'eau est important.",

        actions: [
          "Réparer les fuites",
          "Limiter les douches",
          "Installer des réducteurs",
        ],

        priority: "high",

        icon: "💧",

        trendBoost:
          trends.eau > 15
            ? 2
            : 0,
      });
    }

    // ======================================================
    // DECHETS
    // ======================================================

    const wasteSeverity =
      severityScore(
        dechets,
        "dechets"
      );

    if (wasteSeverity === 3) {
      add({
        category:
          "dechets",

        title:
          "Production de déchets élevée",

        description:
          "Vous produisez trop de déchets.",

        actions: [
          "Tri sélectif",
          "Réduire plastique",
          "Acheter en vrac",
        ],

        priority: "high",

        icon: "♻️",
      });
    }

    // ======================================================
    // TRENDS
    // ======================================================

    if (
      trends.energie > 25 ||
      trends.eau > 25 ||
      trends.dechets > 25
    ) {
      add({
        category: "trend",

        title:
          "Augmentation rapide détectée",

        description:
          "Votre consommation augmente rapidement.",

        actions: [
          "Analyser les nouveaux appareils",
          "Contrôler les habitudes",
        ],

        priority: "high",

        icon: "📈",

        trendBoost: 2,
      });
    }

    // ======================================================
    // SCORE GLOBAL
    // ======================================================

    if (score < 40) {
      add({
        category: "global",

        title:
          "Impact écologique critique",

        description:
          "Réduction urgente recommandée.",

        actions: [
          "Suivi quotidien",
          "Réduction globale",
        ],

        priority: "high",

        icon: "🚨",
      });
    } else if (
      score > 80
    ) {
      add({
        category: "global",

        title:
          "Excellent comportement écologique",

        description:
          "Très bonne gestion écologique.",

        actions: [
          "Maintenir les habitudes",
          "Continuer les efforts",
        ],

        priority: "low",

        icon: "🌱",
      });
    }

    // ======================================================
    // TRI
    // ======================================================

    rec.sort(
      (a, b) =>
        b.weight - a.weight
    );

    // ======================================================
    // SUPPRESSION DOUBLONS
    // ======================================================

    const seen =
      new Set();

    rec = rec.filter((r) => {
      if (
        seen.has(r.category)
      ) {
        return false;
      }

      seen.add(r.category);

      return true;
    });

    // ======================================================
    // VIDE
    // ======================================================

    return rec.length
      ? rec
      : [
          {
            category:
              "global",

            title:
              "Consommation équilibrée",

            description:
              "Votre consommation est stable.",

            priority:
              "low",

            icon: "✅",
          },
        ];
  };

// ======================================================
// CONTROLLER
// ======================================================
exports.getAIRecommendations =
  async (req, res) => {
    try {
      const userId =
        req.user.id;

      // ======================================================
      // CACHE
      // ======================================================

      if (cache[userId]) {
        return res.json({
          ...cache[userId],
          cached: true,
        });
      }

      // ======================================================
      // DATA
      // ======================================================

      const data =
        await Consommation.find(
          {
            user: userId,
          }
        );

      // ======================================================
      // VIDE
      // ======================================================

      if (!data.length) {
        return res.json({
          success: true,

          score: 100,

          niveau:
            "Expert 🌱",

          economie: 0,

          recommendations:
            [
              {
                title:
                  "Aucune donnée",

                description:
                  "Ajoutez vos consommations pour obtenir une analyse IA.",

                priority:
                  "low",
              },
            ],
        });
      }

      // ======================================================
      // CALCULS
      // ======================================================

      let energie = 0;
      let eau = 0;
      let dechets = 0;
      let cout = 0;

      data.forEach((d) => {
        const v =
          safeNumber(
            d.valeur
          );

        if (
          d.type ===
          "energie"
        ) {
          energie += v;
        }

        if (
          d.type === "eau"
        ) {
          eau += v;
        }

        if (
          d.type ===
          "dechets"
        ) {
          dechets += v;
        }

        cout += safeNumber(
          d.cout
        );
      });

      // ======================================================
      // SCORE COMMUN
      // ======================================================

      const score =
        calculateEcoScore(
          energie,
          eau,
          dechets
        );

      const niveau =
        getEcoLevel(score);

      // ======================================================
      // TRENDS
      // ======================================================

      const trends =
        await getPreviousMonthData(
          userId
        );

      // ======================================================
      // RECOMMANDATIONS
      // ======================================================

      const recommendations =
        generateRecommendations(
          {
            energie,
            eau,
            dechets,
            score,
            trends,
          }
        );

      // ======================================================
      // ECONOMIE
      // ======================================================

      const economie =
        Math.round(
          (energie * 0.12 +
            eau * 0.1 +
            dechets * 0.06) /
            10
        );

      // ======================================================
      // CO2
      // ======================================================

      const co2 =
        energie * 0.233 +
        eau * 0.344 +
        dechets * 0.9;

      // ======================================================
      // RESPONSE
      // ======================================================

      const response = {
        success: true,

        score,

        niveau,

        economie,

        co2:
          Math.round(co2),

        consommation: {
          energie,
          eau,
          dechets,
          cout,
        },

        trends,

        recommendations,

        generatedAt:
          new Date(),
      };

      // ======================================================
      // CACHE SAVE
      // ======================================================

      cache[userId] =
        response;

      setTimeout(() => {
        delete cache[userId];
      }, CACHE_DURATION);

      return res.json(
        response
      );
    } catch (err) {
      console.error(
        "Erreur IA:",
        err
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Erreur génération recommandations",
        });
    }
  };