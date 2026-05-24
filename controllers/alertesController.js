const Alert = require("../models/Alert");
const Consommation = require("../models/Consommation");

// ================= MEMORY =================
const userThresholds = new Map();

const DEFAULT_THRESHOLDS = {
  energy: 1000,
  water: 80,
  waste: 50,
};

// ================= HELPERS =================
const getThresholds = (userId) => {
  return (
    userThresholds.get(userId) ||
    DEFAULT_THRESHOLDS
  );
};

const calculateTotals = (items) => {
  let energy = 0;
  let water = 0;
  let waste = 0;

  items.forEach((item) => {
    if (item.type === "energie") {
      energy += item.valeur;
    }

    if (item.type === "eau") {
      water += item.valeur;
    }

    if (item.type === "dechets") {
      waste += item.valeur;
    }
  });

  return {
    energy,
    water,
    waste,
  };
};

// ================= CREATE ALERT =================
exports.createAlert = async (req, res) => {
  try {
    const {
      type,
      message,
      level,
    } = req.body;

    const alert = await Alert.create({
      user: req.user.id,
      type,
      message,
      level: level || "medium",
    });

    res.status(201).json(alert);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// ================= GET ALERTS =================
exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(alerts);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// ================= SAVE THRESHOLDS =================
exports.saveThresholds = async (req, res) => {
  try {
    const thresholds = {
      energy:
        Number(req.body.energy) || 1000,

      water:
        Number(req.body.water) || 80,

      waste:
        Number(req.body.waste) || 50,
    };

    userThresholds.set(
      req.user.id,
      thresholds
    );

    res.json({
      message: "Seuils sauvegardés",
      thresholds,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// ================= GET THRESHOLDS =================
exports.getThresholds = async (req, res) => {
  try {
    const thresholds =
      getThresholds(req.user.id);

    res.json(thresholds);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// ================= CHECK ALERTS =================
exports.checkAlerts = async (req, res) => {
  try {
    const userId = req.user.id;

    // GET DATA
    const consommations =
      await Consommation.find({
        user: userId,
      });

    // TOTALS
    const totals =
      calculateTotals(consommations);

    // THRESHOLDS
    const thresholds =
      getThresholds(userId);

    const alerts = [];

    // ENERGY
    if (
      totals.energy >
      thresholds.energy
    ) {
      const alert =
        await Alert.create({
          user: userId,
          type: "energie",
          level: "high",
          message:
            "Consommation énergie élevée ⚡",
        });

      alerts.push(alert);
    }

    // WATER
    if (
      totals.water >
      thresholds.water
    ) {
      const alert =
        await Alert.create({
          user: userId,
          type: "eau",
          level: "medium",
          message:
            "Consommation eau élevée 💧",
        });

      alerts.push(alert);
    }

    // WASTE
    if (
      totals.waste >
      thresholds.waste
    ) {
      const alert =
        await Alert.create({
          user: userId,
          type: "dechets",
          level: "medium",
          message:
            "Trop de déchets 🗑",
        });

      alerts.push(alert);
    }

    res.json({
      totals,
      thresholds,
      alerts,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// ================= MARK READ =================
exports.markAsRead = async (req, res) => {
  try {
    const alert =
      await Alert.findByIdAndUpdate(
        req.params.id,
        {
          isRead: true,
        },
        {
          new: true,
        }
      );

    res.json(alert);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// ================= DELETE =================
exports.deleteAlert = async (req, res) => {
  try {
    await Alert.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message:
        "Alerte supprimée",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};