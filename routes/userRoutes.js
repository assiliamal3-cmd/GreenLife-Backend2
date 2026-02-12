// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

//  Créer un utilisateur GreenLife
router.post("/", userController.ajouterUtilisateur);

//  Lister tous les utilisateurs
router.get("/", userController.listerUtilisateurs);

//  Récupérer utilisateur par ID
router.get("/:id", userController.getUtilisateurById);

//  Mettre à jour utilisateur
router.put("/:id", userController.updateUtilisateur);

//  Supprimer utilisateur
router.delete("/:id", userController.deleteUtilisateur);

module.exports = router;
