const { feedDB } = require("../config/mongoConnection");
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  postId: {
    type: String,
    required: true,
    unique: true,
  },
  postedTime: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  votes: {
    type: Number,
    default: 0,
  },
  numComments: {
    type: Number,
    default: 0,
  },
  comments: {
    type: [Object],
    default: [],
  },
  reposts: {
    type: [Object],
    default: [],
  },
  userVoteData: {
    type: [Object],
    default: [],
  },
  hasImage: {
    type: Boolean,
    required: true,
    default: false,
  },
  posterId: {
    type: String,
    required: true,
  },
});

module.exports = feedDB.model("Post", postSchema);
