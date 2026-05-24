const express = require("express");

const router = express.Router();

const protect =
  require("../middlewares/authMiddleware");

const {
  authorizeRoles,
} = require("../middlewares/role");

const userController =
  require("../controllers/userController");

console.log(
  "controller keys:",
  Object.keys(userController)
);

// ================= USER =================

// PROFILE
router.get(
  "/profile",
  protect,
  userController.getProfile
);

router.put(
  "/profile",
  protect,
  userController.updateProfile
);

// PASSWORD
router.put(
  "/password",
  protect,
  userController.changePassword
);

// STATS
router.get(
  "/stats",
  protect,
  userController.getStats
);

// HISTORIQUE
router.get(
  "/historique",
  protect,
  userController.getHistorique
);

// ================= PASSWORD RESET =================

router.post(
  "/forgot",
  userController.forgotPassword
);

router.post(
  "/reset/:token",
  userController.resetPassword
);

// ================= ADMIN =================

// LIST USERS
router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  userController.listerUtilisateurs
);

// ================= AJOUTER USER =================
router.post(
  "/ajouter",
  protect,
  authorizeRoles("admin"),
  userController.ajouterUtilisateur
);

// ================= DELETE USER =================
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  userController.supprimerUtilisateur
);

// ================= UPDATE USER =================
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  userController.modifierUtilisateur
);
router.put(
  "/password",
  protect,
  userController.changePassword
);

module.exports = router;