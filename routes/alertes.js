const express = require("express");

const router = express.Router();

const protect =
  require("../middlewares/authMiddleware");

const {
  createAlert,
  getAlerts,
  checkAlerts,
  markAsRead,
  deleteAlert,
  saveThresholds,
  getThresholds,
} = require("../controllers/alertesController");

// ================= ALERTS =================

// GET ALL ALERTS
router.get(
  "/",
  protect,
  getAlerts
);

// CREATE ALERT
router.post(
  "/",
  protect,
  createAlert
);

// CHECK ALERTS
router.post(
  "/check",
  protect,
  checkAlerts
);

// MARK AS READ
router.put(
  "/:id/read",
  protect,
  markAsRead
);

// DELETE ALERT
router.delete(
  "/:id",
  protect,
  deleteAlert
);

// ================= THRESHOLDS =================

// GET THRESHOLDS
router.get(
  "/thresholds",
  protect,
  getThresholds
);

// SAVE THRESHOLDS
router.post(
  "/thresholds",
  protect,
  saveThresholds
);

module.exports = router;