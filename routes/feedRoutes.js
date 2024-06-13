const express = require("express");
const router = express.Router();
const generateRandomString = require("../utility/generateRandomString");

const Post = require("../models/Post");
const User = require("../models/User");

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

router.post("/getVoteStatus", async function (req, res) {
  try {
    const { uid, postId } = req.body;

    const user = await User.findOne({ userID: uid });
    const existingVote =
      user.postsVotedOn.find((vote) => vote.postId === postId) ?? "";

    res.status(200).send(existingVote);
  } catch {
    res.status(500).send("Server error getting post vote status");
  }
});

router.post("/upvotePost", async function (req, res) {
  try {
    const { uid, postId } = req.body;

    const user = await User.findOne({ userID: uid });
    existingVote = user.postsVotedOn.find((vote) => vote.postId === postId);
    //console.log("Existing Vote: " + existingVote.voteType);
    if (existingVote) {
      if (existingVote.voteType == "up") {
        await Post.findOneAndUpdate(
          { postId: postId },
          { $inc: { votes: -1 } },
          { new: true }
        );
        await User.findOneAndUpdate(
          { userID: uid },
          { $pull: { postsVotedOn: { postId: postId } } },
          { new: true }
        );
      } else if (existingVote.voteType == "down") {
        await Post.findOneAndUpdate(
          { postId: postId },
          { $inc: { votes: 2 } },
          { new: true }
        );
        await User.findOneAndUpdate(
          { userID: uid, "postsVotedOn.postId": postId },
          { $set: { "postsVotedOn.$.voteType": "up" } },
          { new: true }
        );
      }
    } else {
      await Post.findOneAndUpdate(
        { postId: postId },
        { $inc: { votes: 1 } },
        { new: true }
      );
      await User.findOneAndUpdate(
        { userID: uid },
        { $push: { postsVotedOn: { postId: postId, voteType: "up" } } },
        { new: true }
      );
    }
  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).send("Server error on upvote");
  }
});

router.post("/downvotePost", async function (req, res) {
  try {
    const { uid, postId } = req.body;

    const user = await User.findOne({ userID: uid });
    existingVote = user.postsVotedOn.find((vote) => vote.postId === postId);
    //console.log("Existing Vote: " + existingVote.voteType);
    if (existingVote) {
      if (existingVote.voteType == "down") {
        await Post.findOneAndUpdate(
          { postId: postId },
          { $inc: { votes: 1 } },
          { new: true }
        );
        await User.findOneAndUpdate(
          { userID: uid },
          { $pull: { postsVotedOn: { postId: postId } } },
          { new: true }
        );
      } else if (existingVote.voteType == "up") {
        await Post.findOneAndUpdate(
          { postId: postId },
          { $inc: { votes: -2 } },
          { new: true }
        );
        await User.findOneAndUpdate(
          { userID: uid, "postsVotedOn.postId": postId },
          { $set: { "postsVotedOn.$.voteType": "down" } },
          { new: true }
        );
      }
    } else {
      await Post.findOneAndUpdate(
        { postId: postId },
        { $inc: { votes: -1 } },
        { new: true }
      );
      await User.findOneAndUpdate(
        { userID: uid },
        { $push: { postsVotedOn: { postId: postId, voteType: "down" } } },
        { new: true }
      );
    }
  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).send("Server error on downvote");
  }
});

router.post("/commentOnPost", async function (req, res) {
  try {
    const { postId, uid } = req.body;

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

module.exports = router;
