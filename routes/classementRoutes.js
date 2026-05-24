const express = require("express");

const router = express.Router();

// ======================================================
// CONTROLLER
// ======================================================
const {
  getClassement,
} = require("../controllers/classementController");

// ======================================================
// MIDDLEWARE AUTH
// ======================================================
const protect = require("../middlewares/authMiddleware");

// ======================================================
// ROUTES
// ======================================================

// GET ECO CLASSEMENT
// URL => /api/classement
router.get(
  "/",
  protect,
  getClassement
);

module.exports = router;