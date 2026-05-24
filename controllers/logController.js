const Log = require("../models/Log");

// ================= GET LOGS =================
exports.getLogs = async (req, res) => {
  try {
    const logs = await Log.find()
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Erreur chargement logs",
    });
  }
};


// ================= CREATE LOG (UTILITAIRE) =================
exports.createLog = async ({
  action,
  user = "Admin",
  userId = null,
  category = "user",
  level = "info",
  details = "",
  req = null,
}) => {
  try {
    // 🔥 protection si action manquante
    if (!action) return;

    await Log.create({
      action,
      user,
      userId,
      category,
      level,
      details,

      // logs techniques (audit réel)
      ip: req?.ip || "",
      userAgent: req?.headers?.["user-agent"] || "",
      route: req?.originalUrl || "",
    });
  } catch (err) {
    console.error("CREATE LOG ERROR:", err.message);
  }
};


// ================= DELETE LOG =================
exports.deleteLog = async (req, res) => {
  try {
    const log = await Log.findById(req.params.id);

    if (!log) {
      return res.status(404).json({
        message: "Log introuvable",
      });
    }

    await Log.findByIdAndDelete(req.params.id);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Erreur suppression",
    });
  }
};