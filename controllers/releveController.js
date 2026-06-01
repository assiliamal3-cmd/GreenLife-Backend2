const Consommation = require("../models/Consommation");

// ================= AJOUT RELEVE =================
exports.ajouterReleve = async (req, res) => {
  try {
    let {
      type,
      valeur,
      cout,
      notes,
      tailleFoyer,
      appareil,
      dateDebut,
      dateFin,
      repartitionMensuelle,
    } = req.body;

    valeur = parseFloat(valeur);
    cout = parseFloat(cout || 0);
    tailleFoyer = parseInt(tailleFoyer || 0);

    // ================= VALIDATION =================
    if (!type) {
      return res.status(400).json({
        message: "Type requis",
      });
    }

    if (isNaN(valeur) || valeur < 0) {
  return res.status(400).json({
    message: "Valeur invalide",
  });
}

    // ================= REPARTITION MENSUELLE =================
    if (
  repartitionMensuelle === "true" &&
  dateDebut &&
  dateFin
) {
      const debut = new Date(dateDebut);
const fin = new Date(dateFin);

if (fin < debut) {
  return res.status(400).json({
    message:
      "La date de fin doit être supérieure à la date de début",
  });
}
      const nbMois =
        (fin.getFullYear() -
          debut.getFullYear()) *
          12 +
        (fin.getMonth() -
          debut.getMonth()) +
        1;

      const releves = [];

      for (let i = 0; i < nbMois; i++) {
        const currentDate = new Date(
          debut.getFullYear(),
          debut.getMonth() + i,
          1
        );
        const existe =
  await Consommation.findOne({
    user: req.user.id,
    type: type.toLowerCase(),
    mois:
      currentDate.getMonth() + 1,
    annee:
      currentDate.getFullYear(),
  });

if (existe) {
  continue;
}

        const releve =
          await Consommation.create({
            user: req.user.id,
            type: type.toLowerCase(),
            valeur: Number(
              (valeur / nbMois).toFixed(2)
            ),
            cout: Number(
              (cout / nbMois).toFixed(2)
            ),
            notes: notes || "",
            tailleFoyer,
            appareil,
            mois:
              currentDate.getMonth() + 1,
            annee:
              currentDate.getFullYear(),
               dateReference: currentDate,
          });

        releves.push(releve);
      }

      return res.status(201).json({
        message:
          "Relevés créés avec succès",
        releves,
      });
    }

    // ================= AJOUT NORMAL =================
    const dateReference = dateDebut
  ? new Date(dateDebut)
  : new Date();
  const existe = await Consommation.findOne({
  user: req.user.id,
  type: type.toLowerCase(),
  mois: dateReference.getMonth() + 1,
  annee: dateReference.getFullYear(),
});

if (existe) {
  return res.status(400).json({
    message:
      "Un relevé existe déjà pour cette période",
  });
}

const releve = await Consommation.create({
  user: req.user.id,
  type: type.toLowerCase(),
  valeur,
  cout,
  notes: notes || "",
  tailleFoyer,
  appareil,

  dateReference,

  mois: dateReference.getMonth() + 1,
  annee: dateReference.getFullYear(),
});

    return res.status(201).json({
      message:
        "Relevé ajouté avec succès",
      releve,
    });

  } catch (err) {

  if (err.code === 11000) {
    return res.status(400).json({
      message:
        "Un relevé existe déjà pour cette période",
    });
  }

  console.error(
  "UPDATE RELEVE ERROR:",
  err
);

  return res.status(500).json({
    message: "Erreur serveur",
  });
}
};

    // ================= VALIDATION =================
   

// ================= LISTE RELEVES =================
exports.getReleves = async (req, res) => {
  try {
    const releves = await Consommation.find({
  user: req.user.id,
}).sort({ dateReference: -1 });

    res.json(releves);

  } catch (err) {
    console.error("GET RELEVES ERROR:", err);

    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// ================= GET ONE =================
exports.getOneReleve = async (req, res) => {
  try {
    const releve = await Consommation.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!releve) {
      return res.status(404).json({
        message: "Relevé introuvable",
      });
    }

    res.json(releve);

  } catch (err) {
    console.error("GET ONE ERROR:", err);

    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// ================= UPDATE =================
exports.updateReleve = async (req, res) => {
  try {
    const releve = await Consommation.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!releve) {
      return res.status(404).json({
        message: "Relevé introuvable",
      });
    }
    if (
  req.body.valeur !== undefined &&
  (
    isNaN(req.body.valeur) ||
    Number(req.body.valeur) < 0
  )
) {
  return res.status(400).json({
    message: "Valeur invalide",
  });
}

    if (req.body.type) {
      releve.type = req.body.type.toLowerCase();
    }

    if (req.body.valeur !== undefined) {
      releve.valeur = parseFloat(req.body.valeur);
    }

    if (req.body.cout !== undefined) {
      releve.cout = parseFloat(req.body.cout);
    }

    if (req.body.notes !== undefined) {
      releve.notes = req.body.notes;
    }

    // ✅ UPDATE TAILLE FOYER
    if (req.body.tailleFoyer !== undefined) {
      releve.tailleFoyer = parseInt(req.body.tailleFoyer || 0);
    }

    // ✅ UPDATE APPAREIL
    if (req.body.appareil !== undefined) {
      releve.appareil = req.body.appareil;
    }
   if (req.body.dateDebut) {
  const d = new Date(req.body.dateDebut);
  const existe =
  await Consommation.findOne({
    _id: { $ne: releve._id },
    user: req.user.id,
    type: releve.type,
    mois: d.getMonth() + 1,
    annee: d.getFullYear(),
  });

if (existe) {
  return res.status(400).json({
    message:
      "Un relevé existe déjà pour cette période",
  });
}

  releve.dateReference = d;
  releve.mois = d.getMonth() + 1;
  releve.annee = d.getFullYear();
}

    await releve.save();

    res.json({
      message: "Relevé mis à jour",
      releve,
    });

  } catch (err) {

  if (err.code === 11000) {
    return res.status(400).json({
      message:
        "Un relevé existe déjà pour cette période",
    });
  }

  console.error(
    "AJOUT RELEVE ERROR:",
    err
  );

  return res.status(500).json({
    message: "Erreur serveur",
  });
}
};

// ================= DELETE =================
exports.deleteReleve = async (req, res) => {
  try {
    const releve = await Consommation.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!releve) {
      return res.status(404).json({
        message: "Relevé introuvable",
      });
    }

    await releve.deleteOne();

    res.json({
      message: "Relevé supprimé",
    });

  } catch (err) {
    console.error("DELETE ERROR:", err);

    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// ================= OCR =================
exports.ocr = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Fichier requis",
      });
    }

    const text = req.file.buffer.toString("utf-8").toLowerCase();

    // ================= VALUE DETECTION =================
    const valueMatch =
  text.match(/(\d+[.,]?\d*)/);

const detectedValue =
  valueMatch
    ? Number(
        valueMatch[0].replace(",", ".")
      )
    : 0;

    // ================= TYPE DETECTION =================
    let detectedType = "energie";

    if (
      text.includes("eau") ||
      text.includes("water") ||
      text.includes("m3")
    ) {
      detectedType = "eau";
    }

    if (
      text.includes("dechet") ||
      text.includes("déchet") ||
      text.includes("waste") ||
      text.includes("kg")
    ) {
      detectedType = "dechets";
    }

    if (
      text.includes("kwh") ||
      text.includes("electric") ||
      text.includes("energie") ||
      text.includes("électricité")
    ) {
      detectedType = "energie";
    }

    return res.json({
      detectedValue,
      detectedType,
    });

  } catch (err) {
    console.error("OCR ERROR:", err);

    res.status(500).json({
      message: "Erreur OCR serveur",
    });
  }
};