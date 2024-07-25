const { sparDB } = require("../config/mongoConnection");
const mongoose = require("mongoose");

const MatchSnapshotsSchema = new mongoose.Schema({
  matchID: {
    type: String,
    required: true,
    unique: true,
  },
  user1Snapshots: {
    type: Object,
    required: true,
  },
  user2Snapshots: {
    type: Object,
    required: true,
  },
});

module.exports = sparDB.model("MatchSnapshots", MatchSnapshotsSchema);
