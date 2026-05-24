const router = require("express").Router();

const protect = require("../middlewares/authMiddleware");
const adminOnly = require("../middlewares/adminOnly");

const {
  getLogs,
  deleteLog,
} = require("../controllers/logController");

// ================= GET ALL LOGS (ADMIN ONLY) =================
router.get(
  "/",
  protect,
  adminOnly,
  getLogs
);

// ================= DELETE LOG (ADMIN ONLY) =================
router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteLog
);

module.exports = router;