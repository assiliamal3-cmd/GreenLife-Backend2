const Settings = require("../models/Settings");

exports.getSettings = async (req, res) => {
  try {
    const acceptLang = req.headers["accept-language"] || "fr";
    const detectedLang = acceptLang.split(",")[0].split("-")[0];

    const allowedLangs = ["fr", "en", "ar"];
    const realLanguage = allowedLangs.includes(detectedLang)
      ? detectedLang
      : "fr";

    let settings = await Settings.findOne({ isGlobal: true });

    if (!settings) {
      settings = await Settings.create({
        isGlobal: true,
        siteName: "GreenLife",
        email: "admin@greenlife.com",
        language: realLanguage,
        darkMode: false,
        notifications: true,
        aiEnabled: true,
        currency: "TND",
        timezone: "Africa/Tunis",
      });
    } else {
      settings.language = realLanguage;
      await settings.save();
    }

    return res.json({
      success: true,
      settings,
    });

  } catch (err) {
    console.error("GET SETTINGS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur settings",
    });
  }
};

// ================= UPDATE SETTINGS =================
exports.updateSettings = async (req, res) => {
  try {
    const normalizeBoolean = (v) => v === true || v === "true";

    const updateData = {
      ...(req.body.siteName !== undefined && { siteName: req.body.siteName }),
      ...(req.body.email !== undefined && { email: req.body.email }),
      ...(req.body.language !== undefined && { language: req.body.language }),
      ...(req.body.currency !== undefined && { currency: req.body.currency }),
      ...(req.body.timezone !== undefined && { timezone: req.body.timezone }),
      ...(req.body.darkMode !== undefined && { darkMode: normalizeBoolean(req.body.darkMode) }),
      ...(req.body.notifications !== undefined && { notifications: normalizeBoolean(req.body.notifications) }),
      ...(req.body.aiEnabled !== undefined && { aiEnabled: normalizeBoolean(req.body.aiEnabled) }),
    };

    let settings = await Settings.findOne({ isGlobal: true });

    if (!settings) {
      settings = await Settings.create({
        isGlobal: true,
        ...updateData,
      });
    } else {
      Object.assign(settings, updateData);
      await settings.save();
    }

    return res.json({
      success: true,
      settings,
    });

  } catch (err) {
    console.error("UPDATE SETTINGS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur update settings",
    });
  }
};