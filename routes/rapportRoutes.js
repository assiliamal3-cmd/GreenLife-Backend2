const express = require("express");

const router = express.Router();

const protect = require("../middlewares/authMiddleware");

const {
  generatePDF,
  exportCSV,
} = require("../controllers/rapportController");

// ======================================================
// PDF + ENVOI EMAIL
// ======================================================

router.get("/pdf", protect, generatePDF);

// ======================================================
// CSV
// ======================================================

router.get("/csv", protect, exportCSV);

module.exports = router;