const express = require("express");
const router = express.Router();
const Player = require("../models/Player");
const Match = require("../models/Match");
const User = require("../models/User");
const generateRandomString = require("../utility/generateRandomString");

// Define routes here

// Returns Users Matches
router.post("/getUserMatches", async function (req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email });
    if (user) {
      res.send(user.activematches);
    }
  } catch {
    console.error("Error retrieving active matches.", error);
  }
});

// Returns one match to the user as a match object
router.post("/getMatchData", async function (req, res) {
  try {
    const { matchId } = req.body;
    const match = await Match.findOne({ matchId: matchId });
    if (match) {
      res.send(match);
    }
  } catch {
    console.error("Error getting match data");
  }
});

// Inputs user into the mathcmkaing database
router.post("/userToMatchmaking", async (req, res) => {
  try {
    const { username, email, userID, skillRating, entryFee, matchLength } =
      req.body;

    const entryFeeInt = parseInt(entryFee);

    const matchLengthInt = parseInt(matchLength);

    const newPlayer = new Player({
      username,
      email,
      userID,
      skillRating,
      entryFeeInt,
      matchLengthInt,
    });
    console.log("Logging player creds in Usertomatchmaking " + newPlayer);

    await newPlayer.save();

    res.send(email + "Entered Matchmaking");
  } catch (err) {
    console.log("inmatchmaking " + err);
  }
});

// Checks to see if the user is in matchmaking
router.post("/areTheyMatchmaking", async (req, res) => {
  try {
    console.log("Are they matchmaking called");

    const { email } = req.body;

    // Find the player in the matchmaking collection by username
    const player = await Player.findOne({ email });

    if (!player) {
      // Player not found, send an error response
      return res.json({
        result: false,
        message: "Player not found in matchmaking",
      });
    }

    // Send a success response
    res.json({ result: true, message: "Matchmaking Player is in matchmaking" });
  } catch (error) {
    console.error("Error checking matchmaking:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Removes the user from the matchmaking database
router.post("/cancelMatchmaking", async (req, res) => {
  try {
    const { email } = req.body;

    // Find the player in the matchmaking collection by username
    const player = await Player.findOne({ email });

    if (!player) {
      // Player not found, send an error response
      return res.status(404).json({ error: "Player not found in matchmaking" });
    }

    // Delete the player from the matchmaking collection
    await Player.deleteOne({ email });

    // Send a success response
    res.json({ message: "Matchmaking canceled successfully" });
  } catch (error) {
    console.error("Error canceling matchmaking:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Creates valid matches, runs on an interval
async function createMatch() {
  try {
    const users = await Player.find({}).exec();

    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const skillDifference = Math.abs(
          users[i].skillRating - users[j].skillRating
        );
        console.log(users[i]);
        if (skillDifference <= 10) {
          // Create a unique match ID (you might want to use a more sophisticated approach)
          const matchId = generateRandomString(45);

          // Insert the matched users into the "matches" collection
          const match = new Match({
            matchId,
            wagerAmt: users[i].entryFeeInt,
            user1: { name: users[i].userID, assets: [], buyingPower: 100000 },
            user2: { name: users[j].userID, assets: [], buyingPower: 100000 },
          });
          await match.save();
          console.log("Updating user:", users[i].email);
          console.log("Match ID:", matchId);
          // Create an object representing the match
          console.log(users[i].email, match.matchId);
          // Add the match to both users' activematches field
          await User.findOneAndUpdate(
            { userID: users[i].userID },
            { $addToSet: { activematches: match.matchId } },
            { new: true } // Return the updated document
          );

          await User.findOneAndUpdate(
            { email: users[j].email },
            { $addToSet: { activematches: match.matchId } },
            { new: true } // Return the updated document
          );
          // Remove matched users from the "matchmaking" collection
          await Player.deleteMany({
            _id: { $in: [users[i]._id, users[j]._id] },
          });
          console.log(`Match found and created: ${matchId}`);
        }
      }
    }
  } catch (error) {
    console.log("Eror in matchmaking", error);
  }
}

// Run the matchmaking process every 10 seconds
setInterval(async () => {
  try {
    await createMatch();
    console.log("Matchmaking process completed successfully");
  } catch (error) {
    console.error("Error in matchmaking process:", error);
  }
}, 5000);

module.exports = router;
