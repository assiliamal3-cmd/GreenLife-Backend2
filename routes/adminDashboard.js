const express =
  require("express");

const router =
  express.Router();

const {
  getAdminStats,
} = require(
  "../controllers/adminDashboardController"
);

router.get(
  "/stats",
  getAdminStats
);

module.exports = router;