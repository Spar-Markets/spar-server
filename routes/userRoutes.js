const express = require("express");
const router = express.Router();

const User = require("../models/User");
const getLeftOfAtSymbol = require("../utility/getLeftOfAtSymbol.js");
const generateRandomString = require("../utility/generateRandomString");
const pastMatches = require("../models/PastMatches");

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

    const userForPastMathces = new pastMatches({
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

module.exports = router;
