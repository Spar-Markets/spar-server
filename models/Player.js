const { sparDB } = require("../config/mongoConnection");
const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  userID: {
    type: String,
    required: false,
    unique: false,
  },
  skillRating: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    default: 50.0,
  },
  enteredMatchmakingAt: {
    type: Date,
    default: Date.now,
    unique: false,
  },
  entryFeeInt: {
    type: Number,
    required: true,
    unique: false,
  },
  matchLengthInt: {
    type: Number,
    required: true,
    unique: false,
  },
});

module.exports = sparDB.model("matchmakingPlayer", playerSchema);
