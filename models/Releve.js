const mongoose = require("mongoose");

const ReleveSchema = new mongoose.Schema(
  {
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["energie", "eau", "dechets"],
      required: true,
      index: true,
    },

    valeur: {
      type: Number,
      required: true,
      min: 0,
    },

    // ✅ AJOUT COÛT
    cout: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ✅ AJOUT TAILLE FOYER
    tailleFoyer: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ✅ AJOUT APPAREILS
    appareil: {
      type: String,
      default: "",
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      maxlength: 500,
    },

    // ✅ IMAGE / FICHIER
    fichier: {
      type: String,
      default: "",
    },

    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// ================= INDEX =================
ReleveSchema.index({ utilisateur: 1, date: -1 });
ReleveSchema.index({ utilisateur: 1, type: 1 });

module.exports = mongoose.model("Releve", ReleveSchema);