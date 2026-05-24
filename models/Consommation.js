// models/Consommation.js

const mongoose = require("mongoose");

const ConsommationSchema =
new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  type: {
    type: String,
    enum: [
      "energie",
      "eau",
      "dechets",
    ],
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
    // ✅ AJOUTS
    tailleFoyer: {
      type: Number,
      default: 1,
    },

    appareil: {
      type: String,
      default: "",
    },

  date: {
    type: Date,
    default: Date.now,
  },

}, {
  timestamps: true,
});

module.exports =
mongoose.model(
  "Consommation",
  ConsommationSchema
);