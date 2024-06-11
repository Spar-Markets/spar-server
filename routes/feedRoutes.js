const express = require("express");
const router = express.Router();
const generateRandomString = require("../utility/generateRandomString");

const Post = require("../models/Post");

//!!!! still need to implement images

// Inputs post into database
router.post("/postToDatabase", async function (req, res) {
  try {
    const { username, postedTime, type, title, body } = req.body;

    const newPost = new Post({
      postId: generateRandomString(40),
      username: username,
      postedTime: postedTime,
      type: type,
      title: title,
      body: body,
    });

    await newPost.save();
  } catch (error) {
    //handle error posting to database
  }
});
