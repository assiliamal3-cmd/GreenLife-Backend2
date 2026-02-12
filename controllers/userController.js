// controllers/userController.js
const User = require("../models/user");

// ➕ Ajouter un utilisateur
exports.ajouterUtilisateur = async (req, res) => {
  try {
    const { email, motDePasse, tailleFoyer, localisation, equipements } = req.body;

    // Vérification champs obligatoires
    if (!email || !motDePasse) {
      return res.status(400).json({
        message: "Email et mot de passe sont obligatoires"
      });
    }

    // Vérifier si email existe déjà
    const userExiste = await User.findOne({ email });
    if (userExiste) {
      return res.status(400).json({
        message: "Cet email est déjà utilisé"
      });
    }

    // Créer utilisateur
    const nouvelUser = new User({
      email,
      motDePasse,
      tailleFoyer,
      localisation,
      equipements
    });

    await nouvelUser.save();

    // Supprimer mot de passe dans réponse
    const userSansPassword = nouvelUser.toObject();
    delete userSansPassword.motDePasse;

    res.status(201).json(userSansPassword);

  } catch (err) {
    res.status(500).json({
      message: "Erreur ajout utilisateur GreenLife",
      error: err.message
    });
  }
};

// 📋 Lister tous les utilisateurs
exports.listerUtilisateurs = async (req, res) => {
  try {
    const users = await User.find().select("-motDePasse");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔍 Récupérer utilisateur par ID
exports.getUtilisateurById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-motDePasse");

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur non trouvé"
      });
    }

    res.status(200).json(user);

  } catch (err) {
    res.status(500).json({
      message: "Erreur récupération utilisateur",
      error: err.message
    });
  }
};

// ✏️ Mettre à jour utilisateur
exports.updateUtilisateur = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select("-motDePasse");

    if (!updatedUser) {
      return res.status(404).json({
        message: "Utilisateur non trouvé"
      });
    }

    res.status(200).json(updatedUser);

  } catch (err) {
    res.status(400).json({
      message: "Erreur mise à jour utilisateur",
      error: err.message
    });
  }
};

// ❌ Supprimer utilisateur
exports.deleteUtilisateur = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({
        message: "Utilisateur non trouvé"
      });
    }

    res.status(200).json({
      message: "Utilisateur supprimé avec succès"
    });

  } catch (err) {
    res.status(500).json({
      message: "Erreur suppression utilisateur",
      error: err.message
    });
  }
};

