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
    const { userID } = req.body;
    const user = await User.findOne({ userID: userID });
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
    const { matchID } = req.body;
    console.log("MatchID: " + matchID);
    const match = await Match.findOne({ matchID: matchID });

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
    const { username, userID, skillRating, entryFee, matchLength, matchType } =
      req.body;

    const entryFeeInt = parseInt(entryFee);

    const matchLengthInt = parseInt(matchLength);

    const newPlayer = new Player({
      username,
      userID,
      skillRating,
      entryFeeInt,
      matchLengthInt,
      matchType,
    });
    console.log("Logging player creds in Usertomatchmaking " + newPlayer);
    console.log("New Player email: " + newPlayer.email);

    await newPlayer.save();
    console.log("Saved player to DB");

    res.send(userID + "Entered Matchmaking");
  } catch (err) {
    console.log("inmatchmaking " + err);
  }
});

// Checks to see if the user is in matchmaking
router.post("/areTheyMatchmaking", async (req, res) => {
  try {
    console.log("Are they matchmaking called");

    const { userID } = req.body;
    console.log("Are they matchmaking:");
    console.log("user id being logged", userID);
    // Find the player in the matchmaking collection by username
    const player = await Player.findOne({ userID: userID });

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
    const { userID } = req.body;

    // Find the player in the matchmaking collection by username
    const player = await Player.findOne({ userID });

    if (!player) {
      // Player not found, send an error response
      return res.status(404).json({ error: "Player not found in matchmaking" });
    }

    // Delete the player from the matchmaking collection
    await Player.deleteOne({ userID });

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
    const players = await Player.find({}).exec();

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const skillDifference = Math.abs(
          players[i].skillRating - players[j].skillRating
        );
        console.log(players[i]);
        if (skillDifference <= 10) {
          // Create a unique match ID (you might want to use a more sophisticated approach)
          const matchID = generateRandomString(45);

          // Insert the matched users into the "matches" collection
          const match = new Match({
            matchID,
            timeframe: players[i].matchLengthInt,
            endAt: Date.now() + players[i].matchLengthInt,
            matchType: players[i].matchType,
            wagerAmt: players[i].entryFeeInt,
            user1: {
              userID: players[i].userID,
              assets: [],
              trades: [],
              portfolioSnapShots: [],
              buyingPower: 100000,
            },
            user2: {
              userID: players[j].userID,
              assets: [],
              trades: [],
              portfolioSnapShots: [],
              buyingPower: 100000,
            },
          });
          await match.save();
          console.log("Updating user:", players[i].userID);
          console.log("Match ID:", matchID);
          // Create an object representing the match
          console.log(players[i].userID, match.matchID);
          // Add the match to both players' activematches field
          await User.findOneAndUpdate(
            { userID: players[i].userID },
            { $addToSet: { activematches: match.matchID } },
            { new: true } // Return the updated document
          );

          await User.findOneAndUpdate(
            { userID: players[j].userID },
            { $addToSet: { activematches: match.matchID } },
            { new: true } // Return the updated document
          );
          // Remove matched players from the "matchmaking" collection
          await Player.deleteMany({
            _id: { $in: [players[i]._id, players[j]._id] },
          });
          console.log(`Match found and created: ${matchID}`);
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
