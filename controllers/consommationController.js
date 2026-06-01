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
  dateDebut,
  dateFin,
  repartitionMensuelle,
} = req.body;

    if (!consommationType) {
      return res.status(400).json({
        message: "Type requis",
      });
    }

   const start = new Date(dateDebut);
const end = new Date(dateFin);

if (!dateDebut || !dateFin) {
  const consommation = await Consommation.create({
    user: req.user.id,
    type: consommationType.toLowerCase(),
    valeur: Number(rawValeur) || 0,
    cout: Number(rawCout) || 0,
    notes: notes || "",
    tailleFoyer: tailleFoyer ? parseInt(tailleFoyer) : 0,
    appareil: appareil
      ? appareil.split(",").map(a => a.trim()).filter(Boolean).join(",")
      : "",
    date: new Date(),
  });

  return res.status(201).json({
    message: "Consommation ajoutée ✅",
    consommation,
  });
}

// ====================== DIFF DAYS ======================
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const daysCount =
  Math.max(1, Math.round((end - start) / MS_PER_DAY) + 1);

const valuePerDay = Number(rawValeur) / daysCount;
const costPerDay = (Number(rawCout) || 0) / daysCount;

// ====================== CREATE DAILY RECORDS ======================
const inserts = [];

for (let i = 0; i < daysCount; i++) {
  const day = new Date(start);
  day.setDate(start.getDate() + i);

  inserts.push({
    user: req.user.id,
    type: consommationType.toLowerCase(),
    valeur: Number(valuePerDay.toFixed(2)),
    cout: costPerDay,
    notes: notes || "",
    tailleFoyer: tailleFoyer ? parseInt(tailleFoyer) : 0,
    appareil: appareil
      ? appareil.split(",").map(a => a.trim()).filter(Boolean).join(",")
      : "",
    date: day, 
    dateDebut,
    dateFin,
    repartitionMensuelle: true,
  });
}

const consommations = await Consommation.insertMany(inserts);
console.log("INSERTED COUNT:", consommations.length);

return res.status(201).json({
  message: "Consommation répartie par jour ✅",
  totalJours: daysCount,
  consommations,
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
  dateDebut,
  dateFin,
  repartitionMensuelle,
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
    if (dateDebut !== undefined) {
  consommation.dateDebut = dateDebut || null;
}

if (dateFin !== undefined) {
  consommation.dateFin = dateFin || null;
}

if (repartitionMensuelle !== undefined) {
  consommation.repartitionMensuelle =
    repartitionMensuelle === true ||
    repartitionMensuelle === "true";
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
