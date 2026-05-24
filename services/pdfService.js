/* eslint-env node */
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generatePDF = (data, filename) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, `../uploads/${filename}`);

    const doc = new PDFDocument();

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // ================= CONTENT =================
    doc.fontSize(20).text("Rapport GreenLife 🌱", { align: "center" });

    doc.moveDown();
    doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);

    doc.moveDown();
    doc.text(`Énergie: ${data.energie} kWh`);
    doc.text(`Eau: ${data.eau} m³`);
    doc.text(`Déchets: ${data.dechets} kg`);

    doc.moveDown();
    doc.text(`CO2: ${data.co2} kg`);
    doc.text(`Économies: ${data.economies} €`);
    doc.text(`Arbres: ${data.arbres}`);

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};

module.exports = generatePDF;