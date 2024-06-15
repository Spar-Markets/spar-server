const { feedDB } = require("../config/mongoConnection");
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  postId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
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
  voters: {
    type: [Object],
    default: [],
  },
});

module.exports = feedDB.model("Post", postSchema);
