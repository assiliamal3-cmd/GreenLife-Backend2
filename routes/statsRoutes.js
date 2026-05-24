const router = require("express").Router();
const protect = require("../middlewares/authMiddleware");

const statsController = require("../controllers/statsController");

router.get("/", protect, statsController.getStats);

module.exports = router;