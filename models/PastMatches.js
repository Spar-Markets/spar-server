const { sparDB } = require("../config/mongoConnection");
const mongoose = require("mongoose");

const PastMatchesSchema = new mongoose.Schema({
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

module.exports = sparDB.model("Match", matchSchema);
