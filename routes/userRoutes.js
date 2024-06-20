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

router.post("/getActiveUser", async (req, res) => {
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

module.exports = router;
