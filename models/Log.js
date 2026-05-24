const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    // action effectuée
    action: {
      type: String,
      required: true,
      trim: true,
    },

    // nom utilisateur
    user: {
      type: String,
      default: "Admin",
    },

    // ID utilisateur réel
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // catégorie
    category: {
      type: String,
      enum: [
        "user",
        "settings",
        "security",
        "warning",
      ],
      default: "user",
    },

    // niveau importance
    level: {
      type: String,
      enum: [
        "info",
        "success",
        "warning",
        "danger",
        "purple",
      ],
      default: "info",
    },

    // description supplémentaire
    details: {
      type: String,
      default: "",
    },

    // adresse IP
    ip: {
      type: String,
      default: "",
    },

    // navigateur
    userAgent: {
      type: String,
      default: "",
    },

    // route API utilisée
    route: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Log",
  logSchema
);