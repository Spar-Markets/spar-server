const express = require("express");
const router = express.Router();
const Player = require("../models/Player");
const Match = require("../models/Match");
const MatchSnapshots = require("../models/MatchSnapshots");

const User = require("../models/User");
const MatchHistory = require("../models/MatchHistory");
const generateRandomString = require("../utility/generateRandomString");
const schedule = require("node-schedule");
const { polygonKey } = require("../config/constants");

const { CloudTasksClient } = require('@google-cloud/tasks');
const { serverUrl } = require("../config/constants");

const client = new CloudTasksClient();

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

// Returns one match to the user as a match object.
router.post("/getMatchData", async function (req, res) {
  try {
    const { matchID } = req.body;
    console.log(
      "MATCH DATA FROM GAME SCREEN BEFORE:",
      new Date(Date.now()).toString()
    );
    const match = await Match.findOne({ matchID: matchID });
    console.log(
      "MATCH DATA FROM GAME SCREEN AFTER:",
      new Date(Date.now()).toString()
    );
    console.log(
      "STATS DATA FROM GAME SCREEN BEFORE:",
      new Date(Date.now()).toString()
    );
    const stats = await Match.findOne({ matchID: matchID }).explain(
      "executionStats"
    );
    console.log(
      "STATS DATA FROM GAME SCREEN AFTER:",
      new Date(Date.now()).toString()
    );
    console.log(
      "Execution time (ms): " + stats.executionStats.executionTimeMillis
    );
    console.log(
      "Total documents examined: " + stats.executionStats.totalDocsExamined
    );
    console.log(
      "Total documents returned: " + stats.executionStats.totalDocsReturned
    );
    console.log(
      "Number of documents returned: " + stats.executionStats.nReturned
    );
    console.log(
      "Total index keys examined: " + stats.executionStats.totalKeysExamined
    );
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
    const { username, userID, entryFee, matchLength, matchType } =
      req.body;

    const entryFeeInt = parseInt(entryFee);

    const matchLengthInt = parseInt(matchLength);

    // Get skill rating
    const user = await User.findOne({ userID: userID }, { skillRating: 1, _id: 0 });
    const skillRating = user.skillRating;

    const newPlayer = new Player({
      username,
      userID,
      skillRating,
      entryFeeInt,
      matchLengthInt,
      matchType,
    });
    console.log("Logging player creds in Usertomatchmaking " + newPlayer);

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
      return res
        .status(400)
        .json({
          message:
            "Cancel matchmaking failed, because player is not in matchmaking.",
        });
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
          console.log("ID", matchID);

          // determine createdAt time and endAt time
          const createdAt = new Date(Date.now());
          const endAt = new Date(Date.now() + players[i].matchLengthInt * 1000);

          // Insert the matched users into the "matches" collection
          const match = new Match({
            matchID: matchID,
            timeframe: players[i].matchLengthInt,
            endAt: endAt,
            createdAt: createdAt,
            matchType: players[i].matchType,
            wagerAmt: players[i].entryFeeInt,
            user1: {
              userID: players[i].userID,
              assets: [],
              trades: [],
              buyingPower: 100000,
            },
            user2: {
              userID: players[j].userID,
              assets: [],
              trades: [],
              snapshots: [],
              buyingPower: 100000,
            },
          });

          const matchSnapshots = new MatchSnapshots({
            matchID: matchID,
            user1Snapshots: [{ value: 100000, timeField: Date.now() }],
            user2Snapshots: [{ value: 100000, timeField: Date.now() }],
          });
          console.log("Alright bro here's the match", match);
          console.log("Also bro here's the snapshots:", matchSnapshots)
          try {
            const test = await match.save();
            console.log(
              "THIS IS THE TEST REPSONSE THAT MATCH WAS SAVED:",
              test
            );
            await matchSnapshots.save();
          } catch (error) {
            console.log("error creating match");
          }
          console.log("Updating user:", players[i].userID);

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

          /**
           * Google cloud task creation to delete match
           */
          const project = "sparmarkets"
          const queue = "deleteMatchQueue0";
          const location = "us-east4";
          const url = `${serverUrl}/deleteMatch`;

          const parent = client.queuePath(project, location, queue);

          const task = {
            httpRequest: {
              httpMethod: 'POST',
              url: url,
              headers: {
                'Content-Type': 'application/json',
              },
              body: Buffer.from(JSON.stringify({ matchID })).toString('base64'),
            },
            scheduleTime: {
              seconds: Math.floor(endAt.getTime() / 1000),
            },
          };

          try {
            const [response] = await client.createTask({ parent, task });
          } catch (error) {
            console.error(error);
          }
          /**
           * End of Google match task creation. c
           */

          console.log(`Match found and created: ${matchID}`);
        }
      }
    }
  } catch (error) {
    console.log("Error in matchmaking", error);
  }
}

router.post("/deleteMatch", async (req, res) => {
  const { matchID } = req.body;
  // delete from mongo
  console.log("GOOGLE CLOUD TASK: Delete from Mongo:", matchID, new Date(Date.now()));

  try {
    const result = await Match.deleteOne({ matchID: matchID });
    if (result.deletedCount === 0) {
      console.error("No match found with the given matchID");
      return res.status(404).json({ message: "Match not found" });
    } else {
      console.log("Match deleted successfully at", new Date(Date.now()));
      res.status(200).json({ message: "Match deleted successfully" });
    }
  } catch (error) {
    console.error("Error automatically deleting document:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Run the matchmaking process every 10 seconds
setInterval(async () => {
  try {
    await createMatch();
  } catch (error) {
    console.error("Error in matchmaking process:", error);
  }
}, 5000);

module.exports = router;
