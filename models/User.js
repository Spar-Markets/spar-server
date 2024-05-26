const { sparDB } = require("../config/mongoConnection");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  userID: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  balance: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0.0,
  },
  skillRating: {
    type: mongoose.Schema.Types.Decimal128,
    default: 50.0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  activematches: {
    type: [String],
    default: [],
    required: true,
  },
  plaidPersonalAccess: {
    type: String,
    default: "",
  },
});

module.exports = sparDB.model("User", userSchema);
