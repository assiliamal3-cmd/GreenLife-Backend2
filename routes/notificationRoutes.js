// routes/notificationRoutes.js

const router =
  require("express").Router();

const protect =
  require("../middlewares/authMiddleware");

const {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require(
  "../controllers/notificationController"
);

// ======================================================
// GET
// ======================================================

router.get(
  "/",
  protect,
  getNotifications
);

// ======================================================
// CREATE
// ======================================================

router.post(
  "/",
  protect,
  createNotification
);

// ======================================================
// READ ONE
// ======================================================

router.put(
  "/:id/read",
  protect,
  markAsRead
);

// ======================================================
// READ ALL
// ======================================================

router.put(
  "/read-all",
  protect,
  markAllAsRead
);

// ======================================================
// DELETE
// ======================================================

router.delete(
  "/:id",
  protect,
  deleteNotification
);

module.exports = router;