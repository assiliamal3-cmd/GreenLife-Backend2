const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// ================= LOAD ENV =================
dotenv.config();

// ================= DB =================
const connectDB = require("./config/db");

// ================= LOGS =================
const { createLog } = require("./controllers/logController");

// ================= INIT APP =================
const app = express();

// ================= CONNECT DATABASE =================
connectDB();

// ================= SECURITY MIDDLEWARE =================
app.use(helmet());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200, // limit requests
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ================= CORS =================
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// ================= BODY PARSER =================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ================= STATIC FILES =================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= REQUEST LOGGER (CONSOLE) =================
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ➡️ ${req.method} ${req.originalUrl}`
  );
  next();
});

// ================= AUDIT LOG (ASYNC OPTIMIZED) =================
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const skipRoutes = ["/", "/api/health"];
    if (skipRoutes.includes(req.originalUrl)) return;

    setImmediate(async () => {
      try {
        await createLog({
          action: `${req.method} ${req.originalUrl}`,
          user: req.user?.nom || "Anonymous",
          userId: req.user?._id || null,
          category: "security",
          level:
            res.statusCode >= 500
              ? "danger"
              : res.statusCode >= 400
              ? "warning"
              : "info",
          details: `Status: ${res.statusCode} | Time: ${
            Date.now() - start
          }ms`,
        });
      } catch (err) {
        console.error("LOG ERROR:", err.message);
      }
    });
  });

  next();
});

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 GreenLife API v1 Running",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    time: new Date(),
  });
});

// ================= ROUTES =================
app.use("/api/auth", require("./routes/auth"));
app.use("/api/utilisateurs", require("./routes/userRoutes"));
app.use("/api/consommations", require("./routes/consommationRoutes"));
app.use("/api/objectifs", require("./routes/objectifRoutes"));
app.use("/api/recommandations", require("./routes/recommandationRoutes"));
app.use("/api/stats", require("./routes/statsRoutes"));
app.use("/api/alertes", require("./routes/alertes"));
app.use("/api/rapports", require("./routes/rapportRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/admin/dashboard", require("./routes/adminDashboard"));
app.use("/api/releves", require("./routes/releveRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/logs", require("./routes/logRoutes"));
app.use("/api/classement", require("./routes/classementRoutes"));

// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route non trouvée ❌",
    path: req.originalUrl,
  });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("🔥 SERVER ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Erreur serveur",
  });
});

// ================= PROCESS ERROR HANDLING =================
process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("🔥 Unhandled Rejection:", err);
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});


