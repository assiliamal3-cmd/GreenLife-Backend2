const Tesseract = require("tesseract.js");

// ================= OCR =================
exports.ocrReleve = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Image requise",
      });
    }

    const imagePath = req.file.path;

    // ================= OCR =================
    const result = await Tesseract.recognize(
      imagePath,
      "eng+fra",
      {
        logger: (m) => console.log(m),
      }
    );

    const text = result.data.text;

    console.log("OCR TEXT:", text);

    // ================= SMART EXTRACTION =================
    const numbers = text.match(/\d+(\.\d+)?/g);

    let detectedValue = null;

    if (numbers && numbers.length > 0) {
      // نختار أكبر رقم (compteur عادة أكبر قيمة)
      detectedValue = Math.max(...numbers.map(Number));
    }

    return res.json({
      text,
      detectedValue,
    });

  } catch (err) {
    console.error("OCR ERROR:", err);

    return res.status(500).json({
      message: "Erreur OCR",
      error: err.message,
    });
  }
};