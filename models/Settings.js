const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      default: "GreenLife",
    },

    email: {
      type: String,
      required: true,
      default: "admin@greenlife.com",
    },

    language: {
      type: String,
      enum: ["fr", "en", "ar"],
      default: "fr",
    },

    darkMode: {
      type: Boolean,
      default: false,
    },

    notifications: {
      type: Boolean,
      default: true,
    },

    aiEnabled: {
      type: Boolean,
      default: true,
    },

    currency: {
      type: String,
      default: "TND",
    },

    timezone: {
      type: String,
      default: "Africa/Tunis",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Settings",
  settingsSchema
);