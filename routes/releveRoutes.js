const express = require("express");
const router = express.Router();

const protect = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

const {
  ajouterReleve,
  getReleves,
  deleteReleve,
  updateReleve,
  getOneReleve,
} = require("../controllers/releveController");

const Tesseract = require("tesseract.js");

// ================= OCR =================
router.post(
  "/ocr",
  protect,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Image requise",
        });
      }

      // ================= OCR =================
      const result = await Tesseract.recognize(
        req.file.buffer,
        "eng+fra",
        {
          logger: () => {},
        }
      );

      const text = result.data.text.toLowerCase();

      // ================= DETECT VALUE =================
      const numbers = text
        .replace(/[^0-9.]/g, " ")
        .split(" ")
        .filter(Boolean)
        .map(Number)
        .filter((n) => !isNaN(n));

      const detectedValue =
        numbers.length > 0
          ? Math.max(...numbers)
          : 0;

      // ================= DETECT TYPE =================
      let detectedType = "energie";

      if (
        text.includes("eau") ||
        text.includes("water") ||
        text.includes("m3")
      ) {
        detectedType = "eau";
      }

      if (
        text.includes("dechet") ||
        text.includes("déchet") ||
        text.includes("waste") ||
        text.includes("kg")
      ) {
        detectedType = "dechets";
      }

      if (
        text.includes("kwh") ||
        text.includes("electric") ||
        text.includes("energie") ||
        text.includes("électricité")
      ) {
        detectedType = "energie";
      }

      return res.json({
        text,
        detectedValue,
        detectedType,
        confidence: result.data.confidence,
      });

    } catch (err) {
      console.error("OCR ERROR:", err);

      return res.status(500).json({
        message: "OCR error",
      });
    }
  }
);

// ================= CRUD =================

// CREATE
router.post(
  "/",
  protect,
  upload.single("file"),
  ajouterReleve
);

// GET ALL
router.get(
  "/",
  protect,
  getReleves
);

// GET ONE
router.get(
  "/:id",
  protect,
  getOneReleve
);

// UPDATE
router.put(
  "/:id",
  protect,
  upload.single("file"),
  updateReleve
);

// DELETE
router.delete(
  "/:id",
  protect,
  deleteReleve
);

module.exports = router;