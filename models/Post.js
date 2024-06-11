const { sparDB } = require("../config/mongoConnection");
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  postId: {
    type: number,
    required: true,
    unique: true,
  },
  username: {
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
    type: number,
    default: 0,
  },
  comments: {
    type: [Object],
  },
  reposts: {
    type: [Object],
  },
  upvotes: {
    type: number,
    default: 0,
  },
  downvotes: {
    type: number,
    default: 0,
  },
});

module.exports = sparDB.model("Post", postSchema);
