const express = require("express");
const router = express.Router();
const generateRandomString = require("../utility/generateRandomString");

const Post = require("../models/Post");

//!!!! still need to implement images

// Inputs post into database
router.post("/postToDatabase", async function (req, res) {
  try {
    const { postId, username, postedTime, type, title, message } = req.body;

    const newPost = new Post({
      postId: postId,
      username: username,
      postedTime: postedTime,
      type: type,
      title: title,
      body: message,
    });
    await newPost.save();
    res.send(newPost);
  } catch (error) {
    console.log(error);
  }
});

/*Dynamically gets Posts in reverse order which effectively makes them most recent*/
router.get("/posts", async function (req, res) {
  try {
    const posts = await Post.find({}).sort({ _id: -1 });
    const totalPosts = await Post.countDocuments();

    res.send({ posts, totalPosts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("");

module.exports = router;
