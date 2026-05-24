const User = require("../models/User");
const Consommation = require("../models/Consommation");

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// ================= PROFILE =================
exports.getProfile = async (req, res) => {
  try {
    const user =
      await User.findById(
        req.user._id
      ).select("-motDePasse");

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Utilisateur introuvable",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message:
        "Erreur serveur",
    });
  }
};

// ================= UPDATE PROFILE =================
exports.updateProfile = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Utilisateur introuvable",
      });
    }

    user.nom =
      req.body.nom ||
      user.nom;

    user.localisation =
      req.body.localisation ||
      user.localisation;

    if (req.file) {
      user.photo =
        req.file.filename;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message:
        "✅ Profil mis à jour",
      user,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message:
        "Erreur serveur",
    });
  }
};

// ================= CHANGE PASSWORD =================
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis",
      });
    }

    const user = await User.findById(req.user._id);

    // ❗ IMPORTANT: vérifier si user existe
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable",
      });
    }

    // ❗ IMPORTANT: vérifier mot de passe existant
    if (!user.motDePasse) {
      return res.status(400).json({
        success: false,
        message: "Mot de passe non défini",
      });
    }

    const match = await bcrypt.compare(
      oldPassword,
      user.motDePasse
    );

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Ancien mot de passe incorrect",
      });
    }

    // ❗ OPTION IMPORTANT (sécurité)
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mot de passe trop court (min 6 caractères)",
      });
    }

    user.motDePasse = await bcrypt.hash(newPassword, 10);

    await user.save();

    res.status(200).json({
      success: true,
      message: "✅ Mot de passe modifié",
    });
  } catch (err) {
    console.error("changePassword error:", err);

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

// ================= DASHBOARD STATS =================
exports.getStats = async (
  req,
  res
) => {
  try {
    const consos =
      await Consommation.find({
        user: req.user._id,
      });

    let energie = 0;
    let eau = 0;
    let dechets = 0;

    consos.forEach((c) => {
      const val = Number(
        c.valeur || 0
      );

      if (
        c.type === "energie"
      ) {
        energie += val;
      } else if (
        c.type === "eau"
      ) {
        eau += val;
      } else if (
        c.type === "dechets"
      ) {
        dechets += val;
      }
    });

    const total =
      energie +
      eau +
      dechets;

    const co2 = Number(
      (energie * 0.5).toFixed(2)
    );

    res.status(200).json({
      success: true,

      energie,
      eau,
      dechets,
      total,
      co2,

      score:
        total > 0
          ? Math.max(
              0,
              100 -
                Math.floor(
                  total / 10
                )
            )
          : 100,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message:
        "Erreur serveur",
    });
  }
};

// ================= HISTORIQUE =================
exports.getHistorique =
  async (req, res) => {
    try {
      const data =
        await Consommation.find({
          user: req.user._id,
        }).sort({
          createdAt: -1,
        });

      res.status(200).json({
        success: true,
        total: data.length,
        historique: data,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message:
          "Erreur serveur",
      });
    }
  };

// ================= FORGOT PASSWORD =================
exports.forgotPassword =
  async (req, res) => {
    try {
      const user =
        await User.findOne({
          email:
            req.body.email,
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Utilisateur introuvable",
        });
      }

      const token =
        crypto
          .randomBytes(32)
          .toString("hex");

      user.resetToken =
        token;

      user.resetExpire =
        Date.now() +
        15 * 60 * 1000;

      await user.save();

      res.status(200).json({
        success: true,
        message:
          "✅ Token généré",
        token,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message:
          "Erreur serveur",
      });
    }
  };

// ================= RESET PASSWORD =================
exports.resetPassword =
  async (req, res) => {
    try {
      const user =
        await User.findOne({
          resetToken:
            req.params.token,

          resetExpire: {
            $gt: Date.now(),
          },
        });

      if (!user) {
        return res.status(400).json({
          success: false,
          message:
            "Token invalide ou expiré",
        });
      }

      user.motDePasse =
        await bcrypt.hash(
          req.body.newPassword,
          10
        );

      user.resetToken =
        undefined;

      user.resetExpire =
        undefined;

      await user.save();

      res.status(200).json({
        success: true,
        message:
          "✅ Mot de passe réinitialisé",
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message:
          "Erreur serveur",
      });
    }
  };

// ================= ADMIN LIST USERS =================
exports.listerUtilisateurs =
  async (req, res) => {
    try {
      const users =
        await User.find().select(
          "-motDePasse"
        );

      res.status(200).json({
        success: true,
        total: users.length,
        users,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message:
          "Erreur serveur",
      });
    }
  };

// ================= AJOUTER USER =================
exports.ajouterUtilisateur = async (req, res) => {
  try {
    const {
      nom,
      email,
      motDePasse,
      password,
      role,
    } = req.body;

    const finalPassword = motDePasse || password;

    if (!email || !finalPassword) {
      return res.status(400).json({
        success: false,
        message: "Champs requis",
      });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email déjà utilisé",
      });
    }

    const user = await User.create({
      nom: nom || email.split("@")[0],
      email,
      motDePasse: finalPassword, // ✅ فقط هنا
      role: role || "user",
    });

    res.status(201).json({
      success: true,
      message: "✅ Utilisateur ajouté",
      user,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Erreur ajout utilisateur",
    });
  }
};

// ================= UPDATE USER =================
exports.modifierUtilisateur =
  async (req, res) => {
    try {
      const user =
        await User.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
          }
        ).select("-motDePasse");

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Utilisateur introuvable",
        });
      }

      res.status(200).json({
        success: true,
        message:
          "✅ Utilisateur modifié",
        user,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message:
          "Erreur modification utilisateur",
      });
    }
  };

// ================= DELETE USER =================
exports.supprimerUtilisateur =
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.params.id
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Utilisateur introuvable",
        });
      }

      await user.deleteOne();

      res.status(200).json({
        success: true,
        message:
          "✅ Utilisateur supprimé",
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message:
          "Erreur suppression utilisateur",
      });
    }
  };
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      oldPassword,
      newPassword,
    } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Tous les champs sont requis",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message:
          "Le nouveau mot de passe doit contenir au moins 6 caractères",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable",
      });
    }

    // vérifier ancien password
    const isMatch = await bcrypt.compare(
      oldPassword,
      user.motDePasse
    );

    if (!isMatch) {
      return res.status(400).json({
        message:
          "Ancien mot de passe incorrect",
      });
    }

    // nouveau password
    user.motDePasse = newPassword;

    // schema pre-save hash automatiquement
    await user.save();

    res.json({
      message:
        "Mot de passe modifié avec succès",
    });

  } catch (err) {
    console.log(
      "CHANGE PASSWORD ERROR:",
      err
    );

    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};





