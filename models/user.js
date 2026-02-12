const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
 email: { type: String, unique: true },
 motDePasse: { type: String, unique: true },
 parametresFoyer:{
    tailleFoyer:Number,
    localisation:String,
    equipements:[String]
 },
 dateCreation:{type:Date,default:Date.now}
});
module.exports = mongoose.model("Utilisateur", userSchema);
