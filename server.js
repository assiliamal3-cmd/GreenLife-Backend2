// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Charger les variables d'environnement
dotenv.config();

// Initialiser express
const app = express();

// Connexion MongoDB
connectDB();

// =======================
//  Middlewares globaux
// =======================
app.use(cors());
app.use(express.json());

// =======================
//  Routes API GreenLife
// =======================
app.use("/api/utilisateurs", require("./routes/userRoutes"));

// =======================
//  Route de test API
// =======================
app.get("/", (req, res) => {
  res.send("🌱 API GreenLife fonctionne !");
});

// =======================
//  Middleware 404
// =======================
app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée" });
});

// =======================
//  Middleware erreurs globales
// =======================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Erreur serveur GreenLife",
    error: err.message
  });
});

// =======================
//  Lancer serveur
// =======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur GreenLife lancé sur http://localhost:${PORT}`);
});

