const Settings = require("../models/Settings");

// ================= GET SETTINGS =================
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    // CREATE DEFAULT
    if (!settings) {
      settings = await Settings.create({
        email: "admin@greenlife.com",
      });
    }

    res.json(settings);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur chargement settings",
    });
  }
};

// ================= UPDATE SETTINGS =================
exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings();
    }

    settings.siteName =
      req.body.siteName ?? settings.siteName;

    settings.email =
      req.body.email ?? settings.email;

    settings.language =
      req.body.language ?? settings.language;

    settings.darkMode =
      req.body.darkMode ?? settings.darkMode;

    settings.notifications =
      req.body.notifications ??
      settings.notifications;

    settings.aiEnabled =
      req.body.aiEnabled ??
      settings.aiEnabled;

    settings.currency =
      req.body.currency ?? settings.currency;

    settings.timezone =
      req.body.timezone ?? settings.timezone;

    await settings.save();

    res.json({
      success: true,
      settings,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur update settings",
    });
  }
};