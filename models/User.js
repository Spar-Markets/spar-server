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
    unique: false,
  },
  balance: {
    type: Number,
    default: 0.0,
  },
  skillRating: {
    type: Number,
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
  pastmatches: {
    type: [Object],
    default: [],
    required: true,
  },
  plaidPersonalAccess: {
    type: String,
    default: "",
  },
  postsVotedOn: {
    type: [Object],
  },
  watchedStocks: {
    type: [String],
  },
  followers: {
    type: [String],
    default: [],
  },
  following: {
    type: [String],
    default: [],
  },
  followRequests: {
    type: [Object],
    default: [],
  },
});

module.exports = sparDB.model("User", userSchema);
