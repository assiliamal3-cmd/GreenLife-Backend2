const mongoose = require("mongoose");

const recommandationSchema = new mongoose.Schema({
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["energie", "eau", "dechets", "transport"],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  economieEstimee: {
    type: Number, // % ou kWh ou litres
    default: 0
  },
  dateCreation: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Consommation || mongoose.model("Recommandation", recommandationSchema);