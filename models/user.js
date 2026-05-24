const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    motDePasse: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    ecoScore: {
  type: Number,
  default: 100,
},

    photo: {
      type: String,
      default: "default-avatar.png",
    },

    localisation: String,
    tailleFoyer: Number,
    equipements: [String],

    resetToken: String,
    resetExpire: Date,
  },
 
  {
    timestamps: true,
  }
);

// ✅ PASSWORD HASH FIX FINAL
userSchema.pre("save", async function () {
  if (!this.isModified("motDePasse")) return;

  const salt = await bcrypt.genSalt(10);

  this.motDePasse = await bcrypt.hash(
    this.motDePasse,
    salt
  );
});

module.exports = mongoose.model("User", userSchema);