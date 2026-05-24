const User = require("../models/User");
const Consommation = require("../models/Consommation");
const calculateEcoScore = require("../utils/calculateEcoScore");

// ======================================================
// GET ECO CLASSEMENT
// ======================================================
exports.getClassement = async (req, res) => {
  try {

    // ======================================================
    // GET USERS
    // ======================================================
    const users = await User.find().lean();

    // ======================================================
    // GET CONSOMMATIONS
    // ======================================================
    const consommations = await Consommation.find()
      .populate("user")
      .lean();

    // ======================================================
    // BUILD CLASSEMENT
    // ======================================================
    const classement = await Promise.all(
  users.map(async (user) => {

      // ======================================================
      // FILTER USER CONSOMMATIONS
      // ======================================================
      const userConsommations = consommations.filter(
        (item) =>
          item.user &&
          item.user._id.toString() === user._id.toString()
      );

      // ======================================================
      // TOTALS
      // ======================================================
      let energie = 0;
      let eau = 0;
      let dechets = 0;
      let cout = 0;

      userConsommations.forEach((item) => {

        const valeur = Number(item.valeur) || 0;

        if (item.type === "energie") {
          energie += valeur;
        }

        if (item.type === "eau") {
          eau += valeur;
        }

        if (item.type === "dechets") {
          dechets += valeur;
        }

        cout += Number(item.cout) || 0;
      });

      // ======================================================
      // ECO SCORE
      // ======================================================
      const ecoData =
  await calculateEcoScore(user._id);

const score = ecoData.score;

// ======================================================
// NIVEAU
// ======================================================
let niveau = "Débutant";

if (score >= 80) {
  niveau = "Expert 🌱";
} else if (score >= 50) {
  niveau = "Avancé 👍";
}

      // ======================================================
      // BADGE
      // ======================================================
      let badge = "🌿";

      if (score >= 90) {
        badge = "👑";
      } else if (score >= 80) {
        badge = "🏆";
      } else if (score >= 60) {
        badge = "⭐";
      }

      // ======================================================
      // USER NAME
      // ======================================================
      const nom =
        user.nom &&
        user.nom.trim() !== ""
          ? user.nom
          : user.email
          ? user.email.split("@")[0]
          : "Utilisateur";

      return {
        _id: user._id,

        nom,

        email: user.email || "",

        score,

        niveau,

        badge,

        energie: Math.round(energie),

        eau: Math.round(eau),

        dechets: Math.round(dechets),

        cout: Math.round(cout),

        totalConsommations:
          userConsommations.length,

        avatar:
          nom.charAt(0).toUpperCase(),
      };
    })
);

    // ======================================================
    // SORT BY SCORE
    // ======================================================
    classement.sort((a, b) => b.score - a.score);

    // ======================================================
    // ADD POSITION
    // ======================================================
    const finalClassement = classement.map(
      (user, index) => ({
        ...user,
        position: index + 1,
      })
    );

    // ======================================================
    // RESPONSE
    // ======================================================
    return res.status(200).json({
      success: true,

      totalUsers: finalClassement.length,

      topUser: finalClassement[0] || null,

      classement: finalClassement,
    });

  } catch (error) {

    console.error(
      "CLASSEMENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Erreur serveur classement",
    });
  }
};