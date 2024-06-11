const { feedDB } = require("../config/mongoConnection");
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: String,
  description: String,
  imgUrl: String,
});

module.exports = stockDB.model("post", postSchema);
