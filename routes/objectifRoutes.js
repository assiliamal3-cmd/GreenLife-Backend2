const express = require("express");
const router = express.Router();

const protect = require("../middlewares/authMiddleware");
const controller = require("../controllers/objectifController");

// ================= ROUTES =================

// GET ALL
router.get("/", protect, controller.getObjectifs);

// GET ONE
router.get("/:id", protect, controller.getObjectifById);

// CREATE
router.post("/", protect, controller.createObjectif);

// UPDATE
router.put("/:id", protect, controller.updateObjectif);

// MARK DONE
router.patch("/:id/done", protect, controller.markObjectifAsDone);

// DELETE
router.delete("/:id", protect, controller.deleteObjectif);

module.exports = router;
