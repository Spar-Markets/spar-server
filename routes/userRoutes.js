const express = require("express");
const router = express.Router();

const User = require("../models/User");
const getLeftOfAtSymbol = require("../utility/getLeftOfAtSymbol.js");
const generateRandomString = require("../utility/generateRandomString");
const MatchHistory = require("../models/MatchHistory");
const Friends = require("../models/Friends");

// define routes here

router.post("/createUser", async (req, res) => {
  try {
    console.log(req.body);
    const {
      email,
      userID,
      username,
      defaultProfileImage,
      hasDefaultProfileImage,
    } = req.body;
    console.log("Received email:", email);

    const newUser = new User({
      username: String(username),
      userID: String(userID),
      email: String(email),
      defaultProfileImage: String(defaultProfileImage),
      hasDefaultProfileImage: String(hasDefaultProfileImage),
    });

    const newFriendsUser = new Friends({
      userID: String(userID),
    });

    try {
      await newUser.save();
      await newFriendsUser.save();
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(409).json({ error: `${field} is taken` });
      }
    }

    const userForPastMathces = new MatchHistory({
      userID: String(userID),
    });
    await userForPastMathces.save();

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
  console.log("THIS IS THE USER ID BEING PASSED!!!!!!", userID);
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


// Used to get all of the financial accounts associated with a user
router.post("/accounts", async function (request, response, next) {
  // why is this called newaccessotoken?? we should be passing one token to this function
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
    console.log("IN THE TRY BLOCK TO ADD STOCK TO WATCHLIST");
    const updates = watchListNames.map((watchListName) => {
      return User.findOneAndUpdate(
        { userID, "watchLists.watchListName": watchListName },
        { $addToSet: { "watchLists.$.watchedStocks": stockTicker } }, // Use $addToSet to avoid duplicates
        { new: true } // Return the updated document
      ).exec(); // Ensure it returns a Promise
    });

    const results = await Promise.all(updates);
    console.log("UPDATED USER WATCHLISTS WITH NEW STOCK");

    // Check if any update was successful
    const successfulUpdates = results.filter((result) => result !== null);
    if (successfulUpdates.length === 0) {
      return res
        .status(404)
        .json({ message: "No matching watchlists found for the user." });
    }

    return res
      .status(200)
      .json({ message: "Success", updatedWatchLists: successfulUpdates });
  } catch (error) {
    console.error("ERROR FROM ADD TO WATCHLIST", error);
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

router.post("/updateUserProfile", async (req, res) => {
  const { userID, newUsername, newBio } = req.body;

  try {
    const updatedUser = await User.findOneAndUpdate(
      { userID: userID },
      {
        $set: {
          username: newUsername,
          bio: newBio,
        },
      }
    );

    if (!updatedUser) {
      return res.status(404).send("User to update was not found");
    }

    res.status(200).json({
      message: "User profile successfully updated.",
    });
  } catch (error) {
    // check if username is NOT unique, since that would throw error 11000
    if (err.code === 11000 && err.keyPattern && err.keyPattern.username) {
      return res.status(409).json({ message: "Username is already taken." });
    }
    // handle other errors
    return res
      .status(500)
      .json({ message: "Server error when trying to update username/bio." });
  }
});

router.post("/getPastMatches", async (req, res) => {
  const { userID } = req.body;
  console.log("Hitting endpoint");
  try {
    const pastMatchesResponse = await MatchHistory.findOne({ userID: userID });

    if (!pastMatchesResponse) {
      return res.status(404).send("No match history found");
    }

    return res.status(200).json({ message: "Match history found", pastMatches: pastMatchesResponse.pastMatches });
  } catch (error) {
    return res.status(500).send("Server error trying to get Match history");
  }
});

router.post("/updateImageStatus", async (req, res) => {
  const { status, userID } = req.body;

  // Validate status
  if (status !== true && status !== false) {
    console.error("Invalid status value:", status);
    return res.status(400).send("Status must be either 'true' or 'false'");
  }

  try {
    const updatedUser = await User.findOneAndUpdate(
      { userID: userID },
      { $set: { hasDefaultProfileImage: status } }, // Use status directly as string
      { new: true }
    );

    if (!updatedUser) {
      console.error("User not found with userID:", userID);
      return res.status(404).send("User not found");
    }

    res.status(200).json({
      message: "User profile image status updated",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res
      .status(500)
      .send("Server error trying to update profile image status");
  }
});

router.post("/deleteAccount", async (req, res) => {
  const { userID } = req.body;

  try {
    const updatedUser = await User.findOneAndDelete({ userID: userID });

    res.status(200).json({
      message: "User profile deleted",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).send("Server error trying to delete accounts");
  }
});

router.get("/checkUsername/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username: username });
    if (user) {
      return res.status(200).json({ taken: true });
    } else {
      return res.status(200).json({ taken: false });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Server error on /checkUsername endpoint" });
  }
});

router.get("/checkEmail/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ email: email });
    if (user) {
      return res.status(200).json({ taken: true });
    } else {
      return res.status(200).json({ taken: false });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Server error on /checkEmail endpoint" });
  }
});

router.get("/getProfileImages/:userID", async (req, res) => {
  const { userID } = req.params;

  try {
    const user = await User.findOne(
      { userID: userID },
      "hasDefaultProfileImage defaultProfileImage"
    );

    if (!user) {
      return res.status(404).send("User not found");
    }

    res.status(200).json({

      hasDefaultProfileImage: user.hasDefaultProfileImage,
      defaultProfileImage: user.defaultProfileImage,
    });
  } catch (error) {
    console.error("Error fetching profile images:", error);
    res
      .status(500)
      .json({ error: "Server error when trying to fetch profile images" });
  }
});



// Uploads the user's access token
router.post("/uploadUserAccessToken", async (req, res) => {
  // Extract username and newBalance from the request body
  const { userID, accessToken } = req.body;
  console.log("going into updateacces" + accessToken);

  try {
    // Find the user by username and update the balance
    try {
      const user = await User.findOneAndUpdate(
        { userID: userID },
        { $push: { plaidPersonalAccess: accessToken } },
        { new: true } // Return the updated document
      );
    } catch (error) {
      console.log("Error in uploading the useraccesstoken: user doesn't exist");
    }

    // Log another success message to the console
    console.log("Success in accesstokenupdating");

    res.status(201).json({ message: "User AccessToken Updated" });
  } catch (error) {
    console.error("Error AccessToken Failed to Update:", error);
    res.status(500).json({ error: "Could not create user" });
  }
});


// Retreives the users access token
router.post("/getAccessFromMongo", async function (req, res) {
  try {
    const { userID } = req.body; // Destructure email from request body
    const user = await User.findOne({ userID: userID });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const plaidPersonalAccess = user.plaidPersonalAccess;
    return res.send(plaidPersonalAccess);
  } catch (error) {
    console.error("Error retrieving user access:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});










module.exports = router;
