const { sparDB } = require("../config/mongoConnection");
const mongoose = require("mongoose");

const Friends = new mongoose.Schema({
    userID: {
      type: String,
      required: true,
      unique: true,
    },
    friends: {
        type: [String],
        default: [],
    },
    outgoingFriendRequests: {
        type: [Object],
        default: [],
    },
    incomingFriendRequests: {
        type: [Object],
        default: []
    }
  });
  
  module.exports = sparDB.model("Friends", Friends);