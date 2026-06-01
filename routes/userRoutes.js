const express = require("express");

const router = express.Router();

const protect =
  require("../middlewares/authMiddleware");

const {
  authorizeRoles,
} = require("../middlewares/role");
const upload = require("../middlewares/upload"); // multer
const userController =
  require("../controllers/userController");

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

// ================= DELETE MY ACCOUNT =================
// IMPORTANT: AVANT "/:id"

router.delete(
  "/delete",
  protect,
  userController.deleteMyAccount
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

// AJOUTER USER
router.post(
  "/ajouter",
  protect,
  authorizeRoles("admin"),
  userController.ajouterUtilisateur
);

// UPDATE USER
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  userController.modifierUtilisateur
);

// DELETE USER ADMIN
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  userController.supprimerUtilisateur
);
//photo
router.post(
  "/profile/photo",
  protect,
  upload.single("photo"),
  userController.updatePhoto
);

module.exports = router;