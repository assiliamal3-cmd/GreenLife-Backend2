// config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Connexion à MongoDB avec la chaîne de connexion du fichier .env
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Erreur MongoDB: ${error.message}`);
    process.exit(1); // Arrêter le serveur si la connexion échoue
  }
};

module.exports = connectDB;

