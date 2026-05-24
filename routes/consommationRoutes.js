const express = require("express");
const multer = require("multer");

const router = express.Router();

// ================= CONTROLLER =================
const consommationController = require(
  "../controllers/consommationController"
);

// ================= AUTH =================
const protect = require(
  "../middlewares/authMiddleware"
);

// ================= MULTER =================
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ================= ROUTES =================

// GET ALL
router.get(
  "/",
  protect,
  consommationController.getConsommations
);

// GET STATS
router.get(
  "/stats",
  protect,
  consommationController.getStatsConsommation
);

// GET ONE
router.get(
  "/:id",
  protect,
  consommationController.getOneConsommation
);

// CREATE
router.post(
  "/",
  protect,
  upload.single("file"),
  consommationController.ajouterConsommation
);

// UPDATE
router.put(
  "/:id",
  protect,
  upload.single("file"),
  consommationController.updateConsommation
);

// DELETE
router.delete(
  "/:id",
  protect,
  consommationController.deleteConsommation
);

module.exports = router;