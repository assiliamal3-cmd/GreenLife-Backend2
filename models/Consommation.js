const mongoose = require("mongoose");

const ConsommationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  type: {
    type: String,
    enum: ["energie", "eau", "dechets"],
    required: true,
  },

  valeur: {
    type: Number,
    required: true,
    default: 0,
  },

  cout: {
    type: Number,
    default: 0,
  },

  notes: {
    type: String,
    default: "",
  },

  tailleFoyer: {
    type: Number,
    default: 1,
  },

  appareil: {
    type: String,
    default: "",
  },

  dateDebut: {
    type: Date,
    default: null,
  },

  dateFin: {
    type: Date,
    default: null,
  },

  repartitionMensuelle: {
    type: Boolean,
    default: false,
  },

  date: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model(
  "Consommation",
  ConsommationSchema
);