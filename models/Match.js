const { sparDB } = require("../config/mongoConnection");
const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  matchID: {
    type: String,
    required: true,
    unique: true,
  },
  user1: {
    type: Object, // Array of usernames participating in the match
    required: true,
  },
  user2: {
    type: Object,
    required: true,
  },
  wagerAmt: {
    type: Number,
    required: true,
  },
  timeframe: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  // You can add more fields as needed for your specific application
});

module.exports = sparDB.model("Match", matchSchema);
