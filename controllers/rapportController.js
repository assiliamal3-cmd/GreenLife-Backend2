const Consommation = require("../models/Consommation");
const User = require("../models/User");

const PDFDocument = require("pdfkit");
const { Parser } = require("json2csv");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const calculateEcoScore = require("../utils/calculateEcoScore");

const sendReportMail = require("../services/emailService");

const { PassThrough } = require("stream");
const path = require("path");
const fs = require("fs");
const logoPath = path.join(
  __dirname,
  "../assets/logo.png"
);


// ======================================================
// CONFIG DESIGN
// ======================================================

const COLORS = {
  primary: "#16a34a",
  secondary: "#2563eb",
  warning: "#f59e0b",
  danger: "#ef4444",
  dark: "#111827",
  gray: "#6b7280",
  light: "#f3f4f6",
  white: "#ffffff",
};

const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width: 1400,
  height: 500,
  backgroundColour: "white",
});

// ======================================================
// HELPERS
// ======================================================

const safeNumber = (v) =>
  isNaN(Number(v)) ? 0 : Number(v);

const formatDate = (date) =>
  new Date(date).toLocaleDateString(
    "fr-FR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );



const getEcoLevel = (score) => {
  if (score >= 80)
    return {
      label: "Excellent",
      color: COLORS.primary,
      emoji: "🌱",
    };

  if (score >= 60)
    return {
      label: "Bon",
      color: COLORS.secondary,
      emoji: "💧",
    };

  if (score >= 40)
    return {
      label: "Moyen",
      color: COLORS.warning,
      emoji: "⚠️",
    };

  return {
    label: "Critique",
    color: COLORS.danger,
    emoji: "🚨",
  };
};

// ======================================================
// RECOMMANDATIONS
// ======================================================

const generateRecommendations = ({
  energie,
  eau,
  dechets,
  score,
}) => {
  const r = [];

  energie > 500
    ? r.push(
        "⚡ Réduire les appareils énergivores",
        "💡 Utiliser LED"
      )
    : r.push("✅ Énergie maîtrisée");

  eau > 300
    ? r.push(
        "💧 Vérifier fuites",
        "🚿 Réduire douche"
      )
    : r.push("✅ Eau maîtrisée");

  dechets > 100
    ? r.push(
        " Améliorer tri",
        " Réduire plastique"
      )
    : r.push("✅ Déchets OK");

  score < 40
    ? r.push(" Impact critique")
    : score < 70
    ? r.push(
        " Améliorations nécessaires"
      )
    : r.push(
        " Excellent comportement"
      );

  return r;
};

// ======================================================
// MONTHLY STATS
// ======================================================

const buildMonthlyStats = (data) => {
  const grouped = {};

  data.forEach((item) => {
    const d = new Date(item.date);

    const key = `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!grouped[key]) {
      grouped[key] = {
        month: key,
        energie: 0,
        eau: 0,
        dechets: 0,
      };
    }

    const val = safeNumber(item.valeur);

    if (item.type === "energie")
      grouped[key].energie += val;

    if (item.type === "eau")
      grouped[key].eau += val;

    if (item.type === "dechets")
      grouped[key].dechets += val;
  });

  return Object.values(grouped);
};

// ======================================================
// CHART
// ======================================================

const generateChart = async (stats) => {
  const config = {
    type: "line",

    data: {
      labels: stats.map((s) => s.month),

      datasets: [
        {
          label: " Énergie",
          data: stats.map((s) => s.energie),

          borderColor: COLORS.primary,
          backgroundColor: "rgba(22,163,74,0.20)",

          borderWidth: 4,
          pointRadius: 5,
          pointHoverRadius: 8,

          fill: true,
          tension: 0.45,
        },

        {
          label: " Eau",
          data: stats.map((s) => s.eau),

          borderColor: COLORS.secondary,
          backgroundColor: "rgba(37,99,235,0.20)",

          borderWidth: 4,
          pointRadius: 5,
          pointHoverRadius: 8,

          fill: true,
          tension: 0.45,
        },

        {
          label: " Déchets",
          data: stats.map((s) => s.dechets),

          borderColor: COLORS.warning,
          backgroundColor: "rgba(245,158,11,0.20)",

          borderWidth: 4,
          pointRadius: 5,
          pointHoverRadius: 8,

          fill: true,
          tension: 0.45,
        },
      ],
    },

    options: {
      responsive: true,

      plugins: {
        legend: {
          position: "top",

          labels: {
            font: {
              size: 16,
              weight: "bold",
            },

            padding: 20,
          },
        },

        title: {
          display: true,
          text: "Évolution des consommations",
          font: {
            size: 22,
            weight: "bold",
          },
        },
      },

      scales: {
        x: {
          grid: {
            display: false,
          },

          ticks: {
            font: {
              size: 12,
            },
          },
        },

        y: {
          beginAtZero: true,

          grid: {
            color: "#e5e7eb",
          },

          ticks: {
            font: {
              size: 12,
            },
          },
        },
      },
    },
  };

  return await chartJSNodeCanvas.renderToBuffer(config);
};
//
const generatePieChart = async (
  energie,
  eau,
  dechets
) => {
  const config = {
    type: "doughnut",

    data: {
      labels: [
        "Énergie",
        "Eau",
        "Déchets",
      ],

      datasets: [
        {
          data: [
            energie,
            eau,
            dechets,
          ],

          backgroundColor: [
            COLORS.primary,
            COLORS.secondary,
            COLORS.warning,
          ],

          borderWidth: 3,
          borderColor: "#ffffff",
        },
      ],
    },

    options: {
      plugins: {
        legend: {
          position: "bottom",

          labels: {
            font: {
              size: 14,
              weight: "bold",
            },
          },
        },

        title: {
          display: true,
          text: "Répartition des consommations",
          font: {
            size: 20,
            weight: "bold",
          },
        },
      },

      cutout: "65%",
    },
  };

  return await chartJSNodeCanvas.renderToBuffer(config);
};

// ======================================================
// CARD DESIGN
// ======================================================

const drawStatCard = (
  doc,
  {
    x,
    y,
    width,
    height,
    title,
    value,
    color,
    icon,
  }
) => {
  doc
    .roundedRect(
      x,
      y,
      width,
      height,
      18
    )
    .fill("#ffffff");

  doc
    .roundedRect(
      x,
      y,
      width,
      8,
      18
    )
    .fill(color);

  doc
    .fillColor(color)
    .fontSize(20)
    .text(icon, x + 15, y + 12);

  doc
    .fillColor(COLORS.gray)
    .fontSize(11)
    .text(
      title,
      x + 15,
      y + 42
    );

  doc
    .fillColor(COLORS.dark)
    .fontSize(22)
    .font("Helvetica-Bold")
    .text(
      Number(value).toLocaleString(),
      x + 15,
      y + 62
    );
};

// ======================================================
// PDF GENERATION + EMAIL
// ======================================================

exports.generatePDF = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

const user =
  await User.findById(userId);

if (!user) {
  return res.status(404).json({
    message: "Utilisateur introuvable",
  });
}

const data =
  await Consommation.find({
    user: userId,
  }).sort({ date: 1 });

    let energie = 0;
    let eau = 0;
    let dechets = 0;
    let totalCost = 0;

    data.forEach((i) => {
      const v = safeNumber(
        i.valeur
      );

      const c = safeNumber(i.cout);

      totalCost += c;

      if (i.type === "energie")
        energie += v;

      if (i.type === "eau")
        eau += v;

      if (i.type === "dechets")
        dechets += v;
    });

  const result = await calculateEcoScore(userId);

const score = Number(result?.score || 0);

energie = Number(result?.energie || energie);
eau = Number(result?.eau || eau);
dechets = Number(result?.dechets || dechets);

console.log("EcoScore:", score);

    const ecoLevel =
      getEcoLevel(score);

    const recommandations =
      generateRecommendations({
        energie,
        eau,
        dechets,
        score,
      });

    const chart =
  await generateChart(
    buildMonthlyStats(data)
  );

const pieChart =
  await generatePieChart(
    energie,
    eau,
    dechets
  );

    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
    });

    // ======================================================
    // BUFFER PDF
    // ======================================================

    const stream =
      new PassThrough();

    doc.pipe(stream);

    const buffers = [];

    stream.on(
      "data",
      (chunk) => {
        buffers.push(chunk);
      }
    );

    stream.on(
      "end",
      async () => {
        try {
          const pdfBuffer =
            Buffer.concat(buffers);

          // ======================================================
          // ENVOI EMAIL
          // ======================================================

          await sendReportMail(
            user.email,

            "Votre rapport écologique GreenLife 🌱",

            "Bonjour,\n\nVotre rapport PDF est en pièce jointe.\n\nMerci d'utiliser GreenLife 💚",

            [
              {
                filename:
                  "GreenLife_Report.pdf",

                content: pdfBuffer,
              },
            ]
          );
          await createNotification(
  user._id,
  "📄 Rapport généré",
  "Votre rapport écologique a été généré et envoyé par email avec succès.",
  "success"
);

          res.status(200).json({
            success: true,

            message:
              "Rapport envoyé avec succès par email 📧",
          });
        } catch (error) {
          console.error(error);

          res.status(500).json({
            message:
              "Erreur envoi email",
          });
        }
      }
    );


    // ======================================================
    // HEADER
    // ======================================================

    doc
  .rect(0, 0, 700, 180)
  .fill("#0f172a");

if (fs.existsSync(logoPath)) {
  doc.image(
    logoPath,
    420,
    20,
    {
      width: 100,
    }
  );
}

doc
  .fillColor("#22c55e")
  .fontSize(34)
  .font("Helvetica-Bold")
  .text(
    "GREENLIFE",
    40,
    40
  );

doc
  .fillColor("white")
  .fontSize(18)
  .font("Helvetica")
  .text(
    "Rapport écologique intelligent",
    40,
    90
  );

doc
  .fillColor("#d1d5db")
  .fontSize(12)
  .text(
    `Généré le ${formatDate(
      new Date()
    )}`,
    40,
    125
  );

    // ======================================================
    // USER CARD
    // ======================================================

    doc
      .roundedRect(
  40,
  200,
  515,
  90,
  15
)
.fill("#ffffff");

    doc
      .fillColor(COLORS.dark)
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(
  "Utilisateur",
  60,
  215
);

    doc
      .fontSize(12)
      .font("Helvetica")
      .text(
        `Email: ${user?.email}`,
        60,
        205
      );

    doc.text(
  `Consommations : ${data.length}`,
  300,
  245
);

    // ======================================================
    // SCORE CARD
    // ======================================================

    doc
  .fillColor("white")
  .fontSize(20)
  .font("Helvetica-Bold")
  .text(
    "Score écologique",
    60,
    340
  );

doc
  .circle(120, 400, 45)
  .fill("#ffffff");

doc
  .fillColor(ecoLevel.color)
  .fontSize(28)
  .font("Helvetica-Bold")
  .text(
    String(score),
    102,
    388
  );

doc
  .fontSize(10)
  .text(
    "/100",
    108,
    418
  );

doc
  .fillColor("white")
  .fontSize(18)
  .font("Helvetica-Bold")
  .text(
    `Niveau : ${ecoLevel.label}`,
    220,
    390
  );

    // ======================================================
    // STATS
    // ======================================================

    doc
      .fillColor(COLORS.dark)
      .fontSize(20)
      .font("Helvetica-Bold")
      .text(
  "Analyse globale",
  40,
  500
);

    drawStatCard(doc, {
      x: 40,
      y: 540,
      width: 155,
      height: 90,
      title: "Énergie",
      value: energie,
      color: COLORS.primary,
      icon: "⚡",
    });

    drawStatCard(doc, {
      x: 215,
      y: 540,
      width: 155,
      height: 90,
      title: "Eau",
      value: eau,
      color: COLORS.secondary,
      icon: "💧",
    });

    drawStatCard(doc, {
      x: 390,
      y: 540,
      width: 155,
      height: 90,
      title: "Déchets",
      value: dechets,
      color: COLORS.warning,
      icon: "🗑",
    });

    // ======================================================
    // COST
    // ======================================================

    doc
      .roundedRect(
  40,
  670,
  515,
  70,
  15
)
      .fill("#ecfdf5");

    doc
      .fillColor(COLORS.primary)
      .fontSize(18)
      .text(
  `Total écologique : ${totalCost.toFixed(
    2
  )} DT`,
  60,
  695
);
// Resumé IA
doc.addPage();

doc
  .fillColor(COLORS.dark)
  .fontSize(24)
  .font("Helvetica-Bold")
  .text(
    "Résumé écologique"
  );

doc.moveDown();

doc
  .fontSize(14)
  .font("Helvetica")
  .text(
    `Score : ${score}/100`
  );

doc.moveDown();

doc.text(
  `Niveau : ${ecoLevel.label}`
);

doc.moveDown();

doc.text(
  `Consommation énergie : ${energie}`
);

doc.text(
  `Consommation eau : ${eau}`
);

doc.text(
  `Déchets : ${dechets}`
);

doc.moveDown();

doc.text(
  `Économie potentielle : ${(totalCost * 0.15).toFixed(2)} DT / mois`
);

    // ======================================================
    // RECOMMANDATIONS
    // ======================================================

    doc.addPage();

    doc
      .fontSize(22)
      .fillColor(COLORS.dark)
      .text("🤖 Recommandations");

    doc.moveDown();

    recommandations.forEach(
      (r, i) => {
        const y = doc.y;

        doc
          .roundedRect(
            40,
            y,
            515,
            40
          )
          .fill("#f9fafb");

        doc
          .fillColor(COLORS.dark)
          .fontSize(12)
          .text(
            `${i + 1}. ${r}`,
            55,
            y + 12
          );

        doc.moveDown(2);
      }
    );

    // ======================================================
    // CHART
    // ======================================================

    if (chart) {
      doc.addPage();

      doc
        .fontSize(20)
        .fillColor(COLORS.dark)
        .text(
          "📈 Évolution mensuelle",
          {
            align: "center",
          }
        );

      doc.image(chart, {
        fit: [500, 300],
        align: "center",
      });
    }
    //piechart
    if (pieChart) {
  doc.addPage();

  doc
    .fontSize(22)
    .fillColor(COLORS.dark)
    .text(
      "📊 Répartition des consommations",
      {
        align: "center",
      }
    );

  doc.moveDown(2);

  doc.image(
    pieChart,
    50,
    120,
    {
      fit: [500, 400],
      align: "center",
    }
  );
}

    // ======================================================
    // HISTORIQUE
    // ======================================================

    doc.addPage();

    doc
      .fontSize(20)
      .fillColor(COLORS.dark)
      .text("📋 Historique");

    doc.moveDown();

    data.forEach((item) => {

  // Nouvelle page si plus assez de place
  if (doc.y > 700) {
    doc.addPage();

    doc
      .fontSize(20)
      .fillColor(COLORS.dark)
      .text("📋 Historique (suite)");

    doc.moveDown();
  }

  const y = doc.y;

  const color =
    item.type === "energie"
      ? COLORS.primary
      : item.type === "eau"
      ? COLORS.secondary
      : COLORS.warning;

  doc
    .roundedRect(
      40,
      y,
      515,
      60
    )
    .fill("#ffffff");

  doc
    .fillColor(color)
    .fontSize(12)
    .text(
      item.type,
      55,
      y + 10
    );

  doc
    .fillColor(COLORS.dark)
    .fontSize(11)
    .text(
      `Valeur: ${item.valeur} | Coût: ${item.cout} DT`,
      55,
      y + 30
    );

  doc.text(
    `Date: ${formatDate(item.date)}`,
    350,
    y + 30
  );

  doc.moveDown(3);
});

    // ======================================================
    // FOOTER
    // ======================================================

    doc
      .fontSize(10)
      .fillColor(COLORS.gray)
      .text(
        "GreenLife © 2026",
        0,
        780,
        {
          align: "center",
        }
      );

    doc.end();
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Erreur génération PDF",
    });
  }
};

// ======================================================
// CSV EXPORT
// ======================================================

exports.exportCSV = async (
  req,
  res
) => {
  try {
    const data =
      await Consommation.find({
        user: req.user.id,
      });

    const rows = data.map(
      (item, i) => ({
        numero: i + 1,
        type: item.type,
        valeur: safeNumber(
          item.valeur
        ),
        cout: safeNumber(item.cout),
        date: formatDate(item.date),
      })
    );

    const parser = new Parser({
      fields: [
        "numero",
        "type",
        "valeur",
        "cout",
        "date",
      ],
    });

    const csv = parser.parse(rows);

    res.header(
      "Content-Type",
      "text/csv"
    );

    res.attachment("data.csv");

    res.send(csv);
  } catch (err) {
    res.status(500).json({
      message: "Erreur CSV",
    });
  }
};