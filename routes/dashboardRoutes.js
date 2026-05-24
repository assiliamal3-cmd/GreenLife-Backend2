const router =
require("express").Router();

const protect =
require("../middlewares/authMiddleware");

const dashboardController =
require("../controllers/dashboardController");

// ================= DASHBOARD =================
router.get(
  "/",
  protect,
  dashboardController.getDashboard
);

module.exports = router;