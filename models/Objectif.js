const mongoose = require("mongoose");

const objectifSchema = new mongoose.Schema(
  {
    // ================= USER =================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ================= TYPE =================
    type: {
      type: String,
      enum: ["energie", "eau", "dechets"],
      required: true,
      index: true,
    },

    // ================= BASIC INFO =================
    title: {
      type: String,
      trim: true,
      default: "Objectif",
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    // ================= TARGET =================
    target: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      default: "unit",
    },

    // ================= PROGRESS =================
    current: {
      type: Number,
      default: 0,
      min: 0,
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ================= STATUS =================
    status: {
      type: String,
      enum: ["active", "paused", "done"],
      default: "active",
      index: true,
    },

    // ================= HISTORY =================
    history: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        value: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ================= INDEX OPTIMISÉS =================
objectifSchema.index({ user: 1, type: 1 });
objectifSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("Objectif", objectifSchema);
