const router = require("express").Router();

const protect =
require("../middlewares/authMiddleware");

const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");

// GET
router.get("/", protect, getSettings);

// UPDATE
router.put("/", protect, updateSettings);

module.exports = router;