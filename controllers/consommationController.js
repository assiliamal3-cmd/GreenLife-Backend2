const Consommation = require("../models/Consommation");
const calculateEcoScore = require("../utils/calculateEcoScore");
const User = require("../models/User");



// ================= AJOUTER =================
exports.ajouterConsommation = async (req, res) => {
  try {

    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    if (!req.user?.id) {
      return res.status(401).json({
        message: "Non authentifié",
      });
    }

    const {
      type: consommationType,
      valeur: rawValeur,
      cout: rawCout,
      notes,
      tailleFoyer,
      appareil,
    } = req.body;

    if (!consommationType) {
      return res.status(400).json({
        message: "Type requis",
      });
    }

    const consommation =
      await Consommation.create({

        user: req.user.id,

        type:
          consommationType.toLowerCase(),

        valeur:
          Number(rawValeur) || 0,

        cout:
          Number(rawCout) || 0,

        notes: notes || "",

        tailleFoyer:
          tailleFoyer !== undefined &&
          tailleFoyer !== null &&
          tailleFoyer !== ""
            ? parseInt(tailleFoyer)
            : 0,

        appareil: appareil
          ? appareil
              .split(",")
              .map((a) => a.trim())
              .filter(Boolean)
              .join(",")
          : "",
      });

    // ======================================================
    // UPDATE ECO SCORE
    // ======================================================
    const ecoScore =
      await calculateEcoScore(
        req.user.id
      );

    return res.status(201).json({
      message:
        "Consommation ajoutée ✅",

      ecoScore,

      consommation,
    });

  } catch (err) {

    console.error(
      "AJOUT ERROR:",
      err
    );

    return res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// ================= GET ALL =================
exports.getConsommations = async (req, res) => {
  try {

    const data =
      await Consommation.find({
        user: req.user.id,
      }).sort({
        createdAt: -1,
      });

    res.json(data);

  } catch (err) {

    console.error(
      "GET ERROR:",
      err
    );

    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// ================= GET ONE =================
exports.getOneConsommation = async (req, res) => {
  try {

    const data =
      await Consommation.findOne({
        _id: req.params.id,
        user: req.user.id,
      });

    if (!data) {
      return res.status(404).json({
        message:
          "Consommation introuvable",
      });
    }

    res.json(data);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// ================= UPDATE =================
exports.updateConsommation = async (req, res) => {
  try {

    const consommation =
      await Consommation.findOne({
        _id: req.params.id,
        user: req.user.id,
      });

    if (!consommation) {
      return res.status(404).json({
        message:
          "Consommation introuvable",
      });
    }

    const {
      type,
      valeur,
      cout,
      notes,
      tailleFoyer,
      appareil,
    } = req.body || {};

    if (type) {
      consommation.type =
        type.toLowerCase();
    }

    if (valeur !== undefined) {
      consommation.valeur =
        parseFloat(valeur || 0);
    }

    if (cout !== undefined) {
      consommation.cout =
        parseFloat(cout || 0);
    }

    if (notes !== undefined) {
      consommation.notes = notes;
    }

    if (tailleFoyer !== undefined) {
      consommation.tailleFoyer =
        Number(tailleFoyer || 0);
    }

    if (appareil !== undefined) {
      consommation.appareil =
        appareil;
    }

    await consommation.save();

    // ======================================================
    // UPDATE ECO SCORE
    // ======================================================
    const ecoScore =
      await calculateEcoScore(
        req.user.id
      );

    res.json({
      message:
        "Consommation mise à jour ✅",

      ecoScore,

      consommation,
    });

  } catch (err) {

    console.error(
      "UPDATE ERROR:",
      err
    );

    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// ================= DELETE =================
exports.deleteConsommation = async (req, res) => {
  try {

    const consommation =
      await Consommation.findOne({
        _id: req.params.id,
        user: req.user.id,
      });

    if (!consommation) {
      return res.status(404).json({
        message:
          "Consommation introuvable",
      });
    }

    await consommation.deleteOne();

    // ======================================================
    // UPDATE ECO SCORE
    // ======================================================
    const ecoScore =
      await calculateEcoScore(
        req.user.id
      );

    res.json({
      message:
        "Consommation supprimée ✅",

      ecoScore,
    });

  } catch (err) {

    console.error(
      "DELETE ERROR:",
      err
    );

    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// ================= STATS =================
exports.getStatsConsommation = async (req, res) => {
  try {

    const data =
      await Consommation.find({
        user: req.user.id,
      });

    let energie = 0;
    let eau = 0;
    let dechets = 0;
    let cout = 0;

    data.forEach((c) => {

      if (c.type === "energie") {
        energie += c.valeur;
      }

      if (c.type === "eau") {
        eau += c.valeur;
      }

      if (c.type === "dechets") {
        dechets += c.valeur;
      }

      cout += c.cout || 0;
    });

    const last =
      data.length > 0
        ? data[data.length - 1]
        : {};

    const total =
      energie + eau + dechets;

    const consoParPersonne =
      last.tailleFoyer > 0
        ? total / last.tailleFoyer
        : 0;

    // ======================================================
    // GET USER SCORE
    // ======================================================
    const user =
      await User.findById(
        req.user.id
      );

    res.json({

      energie,

      eau,

      dechets,

      cout,

      ecoScore:
        user?.ecoScore || 100,

      co2:
        energie * 0.5 +
        dechets * 0.3,

      total,

      tailleFoyer:
        last.tailleFoyer || 0,

      appareil:
        last.appareil || "",

      consoParPersonne:
        Number(
          consoParPersonne.toFixed(2)
        ),
    });

  } catch (err) {

    console.error(
      "STATS ERROR:",
      err
    );

    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};
