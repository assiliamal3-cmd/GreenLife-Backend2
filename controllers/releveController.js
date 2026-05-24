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
    } = req.body;

    // 🔥 FIX important (FormData = string)
    valeur = parseFloat(valeur);
    cout = parseFloat(cout || 0);
    tailleFoyer = parseInt(tailleFoyer || 0);

    // ================= VALIDATION =================
    if (!type) {
      return res.status(400).json({
        message: "Type requis",
      });
    }

    if (!valeur || isNaN(valeur)) {
      return res.status(400).json({
        message: "Valeur invalide",
      });
    }

    // ================= CREATE =================
    const releve = await Consommation.create({
      user: req.user.id,
      type: type.toLowerCase(),
      valeur,
      cout,
      notes: notes || "",

      // ✅ NOUVEAUX CHAMPS
      tailleFoyer,
      appareil,
    });

    res.status(201).json({
      message: "Relevé ajouté avec succès",
      releve,
    });

  } catch (err) {
    console.error("AJOUT RELEVE ERROR:", err);

    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// ================= LISTE RELEVES =================
exports.getReleves = async (req, res) => {
  try {
    const releves = await Consommation.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

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

    await releve.save();

    res.json({
      message: "Relevé mis à jour",
      releve,
    });

  } catch (err) {
    console.error("UPDATE ERROR:", err);

    res.status(500).json({
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
    const valueMatch = text.match(/(\d+(\.\d+)?)/);
    const detectedValue = valueMatch ? Number(valueMatch[0]) : 0;

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