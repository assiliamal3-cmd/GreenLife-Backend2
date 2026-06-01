const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");


// ================= JWT =================
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Champs manquants" });
    }

    const newUser = await User.create({
      email,
      motDePasse: password,
    });


    const token = generateToken(newUser);

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
    });

  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("LOGIN BODY:", req.body);

    if (!email || !password) {
      return res.status(400).json({
        message: "Email et mot de passe requis",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Utilisateur introuvable",
      });
    }

    const match = await bcrypt.compare(password, user.motDePasse);

    if (!match) {
      return res.status(400).json({
        message: "Mot de passe incorrect",
      });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ================= FORGOT PASSWORD =================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email obligatoire" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetToken = resetToken;
    user.resetExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    const link = `http://localhost:5173/reset-password/${resetToken}`;

    await sendEmail(
      user.email,
      "Reset Password",
      `
      <h2>Réinitialisation mot de passe</h2>
      <p>Cliquez sur le lien :</p>
      <a href="${link}">${link}</a>
      <p>Expire dans 15 minutes</p>
      `
    );

    res.json({ message: "Email envoyé" });

  } catch (err) {
    console.log("FORGOT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
  try {
    const token = req.params.token?.trim();
    const { password } = req.body;

    console.log("TOKEN RECEIVED:", token);

    const user = await User.findOne({
      resetToken: token,
      resetExpire: { $gt: new Date() },
    });

    console.log("USER FOUND:", user);

    if (!user) {
      return res.status(400).json({
        message: "Token invalide ou expiré",
      });
    }

    user.motDePasse = password;
    user.resetToken = undefined;
    user.resetExpire = undefined;

    await user.save();

    res.json({ message: "Mot de passe mis à jour" });

  } catch (err) {
    console.log("RESET ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
