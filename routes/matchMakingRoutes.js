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

const { CloudTasksClient } = require("@google-cloud/tasks");
const { serverUrl } = require("../config/constants");

const client = new CloudTasksClient();

// Define routes here

// Returns Users Matches
router.post("/getUserMatches", async function (req, res) {
  try {
    const { userID } = req.body;
    const user = await User.findOne({ userID: userID });
    console.log("grant", user);
    if (user) {
      // Convert Map to Array
      const activeMatchesArray = Array.from(user.activematches.values());
      res.send(activeMatchesArray);
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error retrieving active matches.", error);
    res.status(500).send("Error retrieving active matches.");
  }
});

// Returns one match to the user as a match object.
router.post("/getMatchData", async function (req, res) {
  try {
    const { matchID } = req.body;
    console.log("hello we are getting match data", matchID);
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
    const { username, userID, entryFee, matchLength, matchType } = req.body;

    const entryFeeInt = parseInt(entryFee);

    const matchLengthInt = parseInt(matchLength);

    // Get skill rating
    const user = await User.findOne(
      { userID: userID },
      { skillRating: 1, _id: 0 }
    );
    const skillRating = user.skillRating;

    const player = {
      username,
      userID,
      skillRating,
      entryFeeInt,
      matchLengthInt,
      matchType,
    };

    // const newPlayer = new Player({
    //   username,
    //   userID,
    //   skillRating,
    //   entryFeeInt,
    //   matchLengthInt,
    //   matchType,
    // });

    // await newPlayer.save();
    enterMatchmaking(player);

    res.send(userID + "Entered Matchmaking");
  } catch (err) {
    console.log("inmatchmaking " + err);
    res.status(400).send({ error: err });
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
      return res.status(400).json({
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

// Creates a valid match if exists, otherwise puts you in matchmaking
async function enterMatchmaking(player) {
  try {
    // check if they have enough funds for the match
    const user = await User.findOne({ userID: player.userID });
    if (user.balance < player.entryFeeInt) {
      throw new Error("Error entering matchmaking: insufficient funds");
    }

    console.log("STEP 1: Player in matchmaking");
    // check if there is a player that can be matched
    const players = await Player.find({
      entryFeeInt: player.entryFeeInt,
      matchLengthInt: player.matchLengthInt,
    });

    for (let i = 0; i < players.length; i++) {
      const skillDifference = Math.abs(
        player.skillRating - players[i].skillRating
      );

      if (
        ("TODO: delete this" == "TODO: delete this" || skillDifference <= 10) &&
        players[i].userID != player.userID
      ) {
        // check both player's buying power
        const user1balance = await User.findOne(
          { userID: player.userID },
          "balance"
        );
        // if first user has insufficient funds, simply return, since they are not yet in matchmaking
        if (user.balance < player.entryFeeInt) {
          return;
        }

        const user2balance = await User.findOne(
          { userID: players[i].userID },
          "balance"
        );
        // if the second user is broke and can't afford the match, remove them from matchmaking
        if (user.balance < player.entryFeeInt) {
          await Player.deleteOne({ _id: players[i]._id });
          return;
        }
        createMatch(player, players[i]);
        return;
      } else {
        console.log("STEP 2: CONDITIONS WERE NOT MET.");
      }
    }
  } catch (error) {
    console.log("Error in matchmaking", error);
  }

  // If we get here, match was not made. Add user to matchmaking
  Player.create(player);
}

router.post("/challengeFriend", async (req, res) => {
  // needs userID of challenger, wager, timeframe, and timestamp
  const { challengerUserID, invitedUserID, wager, timeframe, mode } = req.body;

  const invitation = {
    challengerUserID,
    wager,
    timeframe,
    createdAt: Date.now(),
    mode,
  };

  try {
    const response = await User.updateOne(
      { userID: invitedUserID },
      { $push: { invitations: invitation } },
      { upsert: true }
    );
    if (!response) {
      res.status(404).send("");
    } else if (response.matchedCount === 0) {
      res.status(404).send("No document found with the specified userID.");
    } else if (response.modifiedCount === 0) {
      res.status(404).send("No document was modified.");
    } else {
      res.status(200).send("Document was successfully modified.");
    }
  } catch {
    return res
      .status(500)
      .send("Server error trying to send invitation", invitation);
  }
});

// router.post("/acceptChallenge", asy)

/**
 * Create match function
 */
async function createMatch(player1, player2) {
  console.log("STEP 2: CREATE MATCH FUNCTION HIT");
  /**
   * Create match functionality here.
   * Player1 is NOT in matchmaking, player2 IS in matchmaking
   */
  // Remove matched players from the "matchmaking" collection
  await Player.deleteMany({
    _id: player2._id,
  });

  // Create a unique match ID (you might want to use a more sophisticated approach)
  const matchID = generateRandomString(45);

  // determine createdAt time and endAt time
  const createdAt = new Date(Date.now());
  const endAt = new Date(Date.now() + player1.matchLengthInt * 1000);

  // Insert the matched users into the "matches" collection
  const match = new Match({
    matchID: matchID,
    timeframe: player1.matchLengthInt,
    endAt: endAt,
    createdAt: createdAt,
    matchType: player1.matchType,
    wagerAmt: player1.entryFeeInt,
    user1: {
      userID: player1.userID,
      assets: [],
      trades: [],
      buyingPower: 100000,
    },
    user2: {
      userID: player2.userID,
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
  console.log("Also bro here's the snapshots:", matchSnapshots);
  try {
    const test = await match.save();
    console.log("THIS IS THE TEST REPSONSE THAT MATCH WAS SAVED:", test);
    await matchSnapshots.save();
  } catch (error) {
    console.log("error creating match");
  }

  await User.findOneAndUpdate(
    { userID: player1.userID },
    {
      $push: {
        activematches: {
          $each: [{ matchID: matchID, endAt: endAt }],
          $sort: { endAt: 1 }, // 1 for ascending order
        },
      },
      $inc: { balance: -player1.entryFeeInt },
    },
    { new: true }
  );

  await User.findOneAndUpdate(
    { userID: player2.userID },
    {
      $push: {
        activematches: {
          $each: [{ matchID: matchID, endAt: endAt }],
          $sort: { endAt: 1 },
        },
      },
      $inc: { balance: -player2.entryFeeInt },
    },
    { new: true }
  );

  /**
   * Google cloud task creation to delete match
   */
  const project = "sparmarkets";
  const queue = "deleteMatchQueue0";
  const location = "us-east4";
  const url = `${serverUrl}/deleteMatch`;

  const parent = client.queuePath(project, location, queue);

  const task = {
    httpRequest: {
      httpMethod: "POST",
      url: url,
      headers: {
        "Content-Type": "application/json",
      },
      body: Buffer.from(JSON.stringify({ matchID })).toString("base64"),
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

router.post("/deleteMatch", async (req, res) => {
  const { matchID } = req.body;

  // delete from mongo
  console.log(
    "GOOGLE CLOUD TASK: Delete from Mongo:",
    matchID,
    new Date(Date.now())
  );

  try {
    const result = await Match.deleteOne({ matchID: matchID });
    if (result.deletedCount === 0) {
      console.error("No match found with the given matchID");
      return res.status(200).json({ message: "Match not found" });
    } else {
      console.log("Match deleted successfully at", new Date(Date.now()));
      res.status(200).json({ message: "Match deleted successfully" });
    }
  } catch (error) {
    console.error("Error automatically deleting document:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
