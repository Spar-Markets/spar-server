const express = require("express");
const router = express.Router();

const User = require("../models/User");
const getLeftOfAtSymbol = require("../utility/getLeftOfAtSymbol.js");
const generateRandomString = require("../utility/generateRandomString");
const MatchHistory = require("../models/MatchHistory");

// define routes here

router.post("/createUser", async (req, res) => {
  try {
    console.log(req.body);
    const { email, userID, username } = req.body;
    console.log("Received email:", email);

    const newUser = new User({
      username: String(username),
      userID: String(userID),
      email: String(email),
    });

    const userForPastMathces = new MatchHistory({
      userID: String(userID),
    });
    await userForPastMathces.save();
    await newUser.save();
    console.log("New User Created");
    res
      .status(201)
      .json({ message: "User created successfully", UserDetails: newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Could not create user" });
  }
});

router.post("/getUser", async (req, res) => {
  const { userID } = req.body;
  try {
    const user = await User.findOne({ userID: userID });
    if (user) {
      res.status(200).send(user);
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    res.status(500).send("Error getting active user " + error);
  }
});

router.post("/getMongoAccount", async function (req, res) {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email });
    console.log(user);
    if (user) {
      res.send(user);
    }
  } catch {
    console.error("error");
  }
});

router.post("/checkUserExists", async function (req, res) {
  // HAS TO BE EMAIL
  const { email } = req.body; // Destructure email from request body
  console.log(email); // Check if email is correctly received

  try {
    // Find user by email in the User collection
    const user = await User.findOne({ email: email });

    if (user) {
      // If user exists, send true
      res.send(true);
    } else {
      // If user doesn't exist, send false
      res.send(false);
    }
  } catch (error) {
    console.error("Error checking user existence:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/accounts", async function (request, response, next) {
  const { newAccessToken } = request.body;
  console.log("printing" + newAccessToken);
  try {
    const accountsResponse = await client.accountsGet({
      access_token: newAccessToken,
    });
    console.log(accountsResponse);
    response.json(accountsResponse.data);
  } catch (error) {
    console.log(error);
    return response.json(formatError(error.response));
  }
});

router.post("/getUsernameByID", async (req, res) => {
  const { userID } = req.body;
  try {
    const user = await User.findOne({ userID: userID });
    if (user) {
      res.status(200).json({ username: user.username });
    } else {
      res
        .status(400)
        .json({ error: "User not found in /getUsernameByID endpoint" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error on /getUsernameByID endpoint" });
  }
});

//adds stock to watchlist
router.post("/watchStock", async (req, res) => {
  const { userID, ticker } = req.body;
  try {
    const updatedUser = await User.findOneAndUpdate(
      { userID },
      { $addToSet: { watchedStocks: ticker } }, // $addToSet ensures no duplicates in the array
      { new: true, upsert: true } // upsert creates the document if it doesn't exist
    );

    if (!updatedUser) {
      return res.status(404).send("User not found");
    }
    res.status(200).send(updatedUser);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send("An error occurred while updating the user's watched stocks");
  }
});

//removes stock to watchlist
router.post("/unwatchStock", async (req, res) => {
  const { userID, ticker } = req.body;
  try {
    const updatedUser = await User.findOneAndUpdate(
      { userID },
      { $pull: { watchedStocks: ticker } }, // $pull removes the specified value from the array
      { new: true } // return the updated document
    );

    if (!updatedUser) {
      return res.status(404).send("User not found");
    }
    res.status(200).send(updatedUser);
  } catch (error) {
    console.error("Error updating user's watched stocks:", error);
    res
      .status(500)
      .send("An error occurred while updating the user's watched stocks");
  }
});

router.post("/createWatchlist", async (req, res) => {
  const { userID, watchListName, watchListIcon } = req.body;
  try {
    const updatedUser = await User.findOneAndUpdate(
      { userID },
      {
        $addToSet: {
          watchLists: { watchListName, watchListIcon, watchedStocks: [] },
        },
      },
      { new: true } // return the updated document
    );

    if (!updatedUser) {
      return res.status(404).send("User not found");
    }

    res.status(200).send(updatedUser); // Respond with the updated user document
  } catch (error) {
    console.error("Error creating watchlist:", error);
    res
      .status(500)
      .send("An error occurred while updating the user's watchlists");
  }
});

// Endpoint for adding stocks to multiple watchlists
router.post("/addToWatchList", async (req, res) => {
  const { userID, watchListNames, stockTicker } = req.body;

  if (!Array.isArray(watchListNames)) {
    return res.status(400).json({ message: "watchListNames must be an array" });
  }

  try {
    console.log("IN THE TRY BLOCK OT ADD STOCK TO WATCHLIST");
    const updates = watchListNames.map((watchListName) => {
      return User.findOneAndUpdate(
        { userID, "watchlists.watchListName": watchListName },
        { $addToSet: { "watchlists.$.watchedStocks": stockTicker } }, // Use $addToSet to avoid duplicates
        { new: true } // Return the updated document
      );
    });

    console.log("UPDATED USER WATCHLISTS WITH NEW STOCK");

    if (!updates) {
      console.log("Boutta send a 404");
      return res.status(404).send("User not found");
    }

    console.log("Boutta not send a 404 error ong");
    return res.status(200).json("Success");
  } catch (error) {
    console.log("ERROR FROM ADD TO WATCHLIST", error);
    return res.status(500).json({ message: "An error occurred", error });
  }
});

// Endpoint to check if a ticker is in watchedStocks
router.post("/isWatchedStock", async (req, res) => {
  const { userID, ticker } = req.body; // Use query parameters for GET requests
  try {
    const user = await User.findOne({ userID });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const isWatched = user.watchedStocks.includes(ticker);
    res.status(200).send(isWatched);
  } catch (error) {
    console.error("Error checking user's watched stocks:", error);
    res
      .status(500)
      .send("An error occurred while checking the user's watched stocks");
  }
});

router.post("/getProfileList", async (req, res) => {
  try {
    const users = await User.find({}, "userID username"); // Fetch all users and select userID and username fields
    const userProfiles = users.map((user) => ({
      userID: user.userID,
      username: user.username,
    }));

    res.status(200).json(userProfiles); // Directly send the userProfiles array
  } catch (error) {
    console.error("Error fetching user profiles:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching user profiles" });
  }
});

router.post("/addFollowRequest", async (req, res) => {
  const { userID, otherUserID } = req.body;

  try {
    const updatedOtherUser = await User.findOneAndUpdate(
      { userID: otherUserID },
      {
        $push: {
          followRequests: {
            from: userID,
            status: "pending",
            createdAt: new Date(),
          },
          followers: userID,
        },
      },
      { new: true, upsert: true } // new: true returns the updated document, upsert: true creates it if it doesn't exist
    );

    const updatedUser = await User.findOneAndUpdate(
      { userID: userID },
      {
        $push: {
          following: otherUserID,
        },
      },
      { new: true, upsert: true } // new: true returns the updated document, upsert: true creates it if it doesn't exist
    );

    res.status(200).send(updatedUser);
  } catch (error) {
    console.error("Error adding follow request:", error);
    res.status(500).send("An error occurred while adding the follow request");
  }
});

router.post("/checkFollowStatus", async (req, res) => {
  const { userID, otherUserID } = req.body;

  try {
    const user = await User.findOne({ userID: otherUserID });
    if (!user) {
      return res.status(404).send("User not found");
    }
    console.log(user.followRequests);
    const followRequest = user.followRequests.find(
      (request) => request.from === userID
    );

    console.log("Follow request found:", followRequest);
    if (!followRequest) {
      return res.status(200).json({ status: "none" });
    }

    res.status(200).json({ status: followRequest.status });
  } catch (error) {
    console.error("Error checking follow request status:", error);
    res
      .status(500)
      .send("An error occurred while checking the follow request status");
  }
});

router.post("/checkIncomingFriendRequests", async (req, res) => {
  const { userID } = req.body;

  try {
    // Find the user by userID
    const user = await User.findOne({ userID });
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Get incoming friend requests
    const incomingRequests = user.followRequests.filter(
      (request) => request.status === "pending"
    );

    res.status(200).json({ incomingRequests });
  } catch (error) {
    console.error("Error checking incoming friend requests:", error);
    res
      .status(500)
      .send("An error occurred while checking incoming friend requests");
  }
});

router.post("/acceptFollowRequest", async (req, res) => {
  const { userID, otherUserID } = req.body;

  try {
    // Find the target user and remove the follow request
    const updatedOtherUser = await User.findOneAndUpdate(
      { userID: userID },
      {
        $pull: { followRequests: { from: otherUserID } }, // Remove the follow request
        $addToSet: { following: otherUserID }, // Add userID to followers
      },
      { new: true } // Return the updated document
    );

    if (!updatedOtherUser) {
      return res.status(404).send("Target user not found");
    }

    // Find the user and add the otherUserID to the following array
    const updatedUser = await User.findOneAndUpdate(
      { userID: otherUserID },
      {
        $addToSet: { followers: userID }, // Add otherUserID to following
      },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).send("User not found");
    }

    res.status(200).json({
      message: "Follow request accepted successfully",
      updatedUser,
      updatedOtherUser,
    });
  } catch (error) {
    console.error("Error accepting follow request:", error);
    res
      .status(500)
      .send("An error occurred while accepting the follow request");
  }
});

module.exports = router;
