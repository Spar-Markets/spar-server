const { sparDB } = require("../config/mongoConnection");
const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  matchID: {
    type: String,
    required: true,
    unique: true,
  },
  matchType: {
    type: String,
    required: true,
  },
  user1: {
    type: Object,
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
    required: true,
  },
  endAt: {
    type: Date,
    required: true,
  },
  // You can add more fields as needed for your specific application
});

module.exports = sparDB.model("match", matchSchema);
