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
      "fra+eng",
      {
        logger: (m) => console.log(m),
      }
    );

    const text = result.data.text;

    console.log("OCR TEXT:");
    console.log(text);

    // ================= TYPE DETECTION =================
    let detectedType = "energie";

    const lowerText = text.toLowerCase();

    if (
      lowerText.includes("eau") ||
      lowerText.includes("water") ||
      lowerText.includes("m3")
    ) {
      detectedType = "eau";
    }

    if (
      lowerText.includes("déchet") ||
      lowerText.includes("dechet") ||
      lowerText.includes("waste") ||
      lowerText.includes("kg")
    ) {
      detectedType = "dechets";
    }

    // ================= VALUE DETECTION =================
    let detectedValue = null;

    const unitMatch =
      text.match(/(\d+(?:[.,]\d+)?)\s*(kwh|m3|kg)/i);

    if (unitMatch) {
      detectedValue = parseFloat(
        unitMatch[1].replace(",", ".")
      );
    } else {
      const numbers =
        text.match(/\d+(?:[.,]\d+)?/g);

      if (numbers && numbers.length > 0) {
        detectedValue = Math.max(
          ...numbers.map((n) =>
            parseFloat(
              n.replace(",", ".")
            )
          )
        );
      }
    }

    // ================= DATE DETECTION =================
    const dateRegex =
      /\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/g;

    const dates = text.match(dateRegex) || [];

    let dateDebut = null;
    let dateFin = null;
    let nbMois = 1;

    if (dates.length >= 2) {
      dateDebut = dates[0];
      dateFin = dates[1];

      const debut = new Date(
        dateDebut.split(/[\/-]/).reverse().join("-")
      );

      const fin = new Date(
        dateFin.split(/[\/-]/).reverse().join("-")
      );

      nbMois =
        (fin.getFullYear() -
          debut.getFullYear()) *
          12 +
        (fin.getMonth() -
          debut.getMonth()) +
        1;

      if (nbMois < 1) {
        nbMois = 1;
      }
    }

    // ================= MONTHLY VALUE =================
    const valeurParMois =
      detectedValue && nbMois
        ? Number(
            (
              detectedValue / nbMois
            ).toFixed(2)
          )
        : null;

    return res.json({
      success: true,

      text,

      detectedType,

      detectedValue,

      dateDebut,

      dateFin,

      nbMois,

      valeurParMois,
    });

  } catch (err) {
    console.error(
      "OCR ERROR:",
      err
    );

    return res.status(500).json({
      message: "Erreur OCR",
      error: err.message,
    });
  }
};