const router = require("express").Router();
const protect = require("../middlewares/authMiddleware");
const ctrl = require("../controllers/recommandationController");

router.get("/ai", protect, ctrl.getAIRecommendations);

module.exports = router;