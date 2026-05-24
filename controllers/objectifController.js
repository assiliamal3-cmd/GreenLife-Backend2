const Objectif = require("../models/Objectif");
const Consommation = require("../models/Consommation");

// ================= GET ALL OBJECTIFS =================
exports.getObjectifs = async (req, res) => {
  try {
    const objectifs = await Objectif.find({ user: req.user._id }).lean();

    const result = await Promise.all(
      objectifs.map(async (obj) => {
        const data = await Consommation.find({
          user: req.user._id,
          type: obj.type,
        }).lean();

        const total = data.reduce((sum, c) => sum + (c.valeur || 0), 0);

        const progress = obj.target
          ? Math.min(Math.round((total / obj.target) * 100), 100)
          : 0;

        return {
          ...obj,
          current: total,
          progress,
          history: data.map((c) => ({
            date: c.date,
            value: c.valeur,
          })),
        };
      })
    );

    res.status(200).json(result);
  } catch (err) {
    console.error("GET_OBJECTIFS_ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ================= CREATE =================
exports.createObjectif = async (req, res) => {
  try {
    const { type, target, title } = req.body;

    if (!type || !target) {
      return res.status(400).json({
        message: "type et target sont obligatoires",
      });
    }

    const objectif = await Objectif.create({
      user: req.user._id,
      type,
      target,
      title: title || "Objectif",
      current: 0,
      progress: 0,
    });

    res.status(201).json(objectif);
  } catch (err) {
    console.error("CREATE_OBJECTIF_ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ================= UPDATE =================
exports.updateObjectif = async (req, res) => {
  try {
    const objectif = await Objectif.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );

    if (!objectif) {
      return res.status(404).json({ message: "Objectif introuvable" });
    }

    res.status(200).json(objectif);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ================= DELETE =================
exports.deleteObjectif = async (req, res) => {
  try {
    const objectif = await Objectif.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!objectif) {
      return res.status(404).json({ message: "Objectif introuvable" });
    }

    res.status(200).json({ message: "Supprimé ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ================= GET ONE =================
exports.getObjectifById = async (req, res) => {
  try {
    const objectif = await Objectif.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).lean();

    if (!objectif) {
      return res.status(404).json({ message: "Objectif introuvable" });
    }

    res.status(200).json(objectif);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ================= MARK DONE =================
exports.markObjectifAsDone = async (req, res) => {
  try {
    const objectif = await Objectif.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        progress: 100,
        status: "done",
      },
      { new: true }
    );

    if (!objectif) {
      return res.status(404).json({ message: "Objectif introuvable" });
    }

    res.status(200).json({
      message: "Objectif terminé 🎯",
      objectif,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
