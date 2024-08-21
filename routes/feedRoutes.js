const express = require("express");
const router = express.Router();
const generateRandomString = require("../utility/generateRandomString");

const Post = require("../models/Post");
const User = require("../models/User");

//!!!! still need to implement images

// Inputs post into database
router.post("/postToDatabase", async function (req, res) {
  try {
    const {
      postId,
      postedTime,
      type,
      title,
      message,
      hasImage,
      posterId,
    } = req.body;

    const newPost = new Post({
      postId: postId,
      posterId: posterId,
      postedTime: postedTime,
      type: type,
      title: title,
      body: message,
      hasImage: hasImage,
    });
    await newPost.save();
    res.status(200).send(newPost);
  } catch (error) {
    console.log(error);
  }
});

/*Dynamically gets Posts in reverse order which effectively makes them most recent*/
router.get("/posts", async function (req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10; // Default to 10 if limit is not provided
    const skip = parseInt(req.query.skip) || 0; // Default to 0 if skip is not provided

    const posts = await Post.find({}, "-comments")
      .sort({ _id: -1 }) // Excludes comments array and sorts in reverse order
      .skip(skip)
      .limit(limit);
    const totalPosts = await Post.countDocuments();

    res.send({ posts, totalPosts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/getVoteStatus", async function (req, res) {
  try {
    const { userID, postId } = req.body;

    const post = await Post.findOne({ postId: postId });
    const existingVote =
      post.userVoteData.find((vote) => vote.userID === userID) ?? "";

    res.status(200).send(existingVote);
  } catch {
    res.status(500).send("Server error getting post vote status");
  }
});

router.post("/upvotePost", async function (req, res) {
  try {
    const { userID, postId } = req.body;
    console.log("UserID:", userID);
    const post = await Post.findOne({ postId: postId });
    existingVote = post.userVoteData.find((vote) => vote.userID === userID);
    //console.log("Existing Vote: " + existingVote.voteType);
    if (existingVote) {
      if (existingVote.voteType == "up") {
        await Post.findOneAndUpdate(
          { postId: postId },
          {
            $inc: { votes: -1 },
            $pull: { userVoteData: { userID: userID } },
          },
          { new: true }
        );
      } else if (existingVote.voteType == "down") {
        await Post.findOneAndUpdate(
          { postId: postId, "userVoteData.userID": userID },
          {
            $inc: { votes: 2 },
            $set: { "userVoteData.$.voteType": "up" },
          },
          { new: true }
        );
      }
    } else {
      await Post.findOneAndUpdate(
        { postId: postId },
        {
          $inc: { votes: 1 },
          $push: { userVoteData: { userID: userID, voteType: "up" } },
        },
        { new: true }
      );
    }
    res.status(200).send("Upvote successful");
  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).send("Mongo error: " + error);
  }
});

router.post("/downvotePost", async function (req, res) {
  try {
    const { userID, postId } = req.body;

    const post = await Post.findOne({ postId: postId });
    const existingVote = post.userVoteData.find(
      (vote) => vote.userID === userID
    );

    if (existingVote) {
      if (existingVote.voteType == "down") {
        await Post.findOneAndUpdate(
          { postId: postId },
          { $inc: { votes: 1 }, $pull: { userVoteData: { userID: userID } } },
          { new: true }
        );
      } else if (existingVote.voteType == "up") {
        await Post.findOneAndUpdate(
          { postId: postId, "userVoteData.userID": userID },
          { $inc: { votes: -2 }, $set: { "userVoteData.$.voteType": "down" } },
          { new: true }
        );
      }
    } else {
      await Post.findOneAndUpdate(
        { postId: postId },
        {
          $inc: { votes: -1 },
          $push: { userVoteData: { userID: userID, voteType: "down" } },
        },
        { new: true }
      );
    }
    res.status(200).send("Downvote successful");
  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).send("Server error on downvote");
  }
});

router.post("/commentOnPost", async function (req, res) {
  try {
    const { postId, userID, commentId, username, postedTime, body } = req.body;

    await Post.findOneAndUpdate(
      { postId: postId },
      {
        $push: {
          comments: {
            userID: userID,
            username: username,
            postedTime: postedTime,
            commentId: commentId,
            body: body,
            comments: [],
            votes: 0,
          },
        },
        $inc: { numComments: 1 }, // Move $inc inside the update object
      },
      { new: true } // Ensure this is within the options object
    );

    res.status(200).send("Comment Post Success");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error posting comment");
  }
});

router.post("/getComments", async function (req, res) {
  try {
    const { postId } = req.body;
    const comments = await Post.findOne({ postId: postId }, "comments");

    res.status(200).send(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/deletePost", async function (req, res) {
  try {
    const { postId } = req.body;

    const deletedPost = await Post.findOneAndDelete({ postId: postId });

    if (!deletedPost) {
      return res.status(404).send("Post not found");
    }

    res.status(200).send("Post deleted successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error on delete");
  }
});

// Get posts by a specific userID
router.get("/postsByUser", async function (req, res) {
  try {
    const { userID } = req.query;
    const limit = parseInt(req.query.limit) || 10; // Default to 10 if limit is not provided
    const skip = parseInt(req.query.skip) || 0; // Default to 0 if skip is not provided

    if (!userID) {
      return res.status(400).send("UserID is required");
    }

    const posts = await Post.find({ posterId: userID }, "-comments")
      .sort({ _id: -1 }) // Excludes comments array and sorts in reverse order
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments({ posterId: userID });

    res.status(200).send({ posts, totalPosts });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error fetching posts by user");
  }
});

module.exports = router;
