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
  defaultProfileImage: {
    type: String,
    required: true,
    unique: false,
  },
  hasDefaultProfileImage: {
    type: Boolean,
    required: true,
    unique: false,
  },
  bio: {
    type: String,
    default: "",
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
  activematches: [
    {
      matchID: { type: String, required: true },
      endAt: { type: Date, required: true },
    },
  ],
  plaidPersonalAccess: {
    type: String,
    default: "",
  },
  postsVotedOn: {
    type: [Object],
  },
  watchLists: {
    type: [Object],
    default: [],
  },
  friendCount: {
    type: Number,
    default: 0,
  },
  invitations: {
    type: Object,
    default: {},
  },
});

module.exports = sparDB.model("User", userSchema);
