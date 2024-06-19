const { sparDB } = require("../config/mongoConnection");
const mongoose = require("mongoose");

const MatchHistorySchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
    unique: true,
  },
  pastMatches: [
    {
      type: Object,
      required: true,
    },
  ],
});

module.exports = sparDB.model(
  "MatchHistory",
  MatchHistorySchema,
  "matchhistory"
);
