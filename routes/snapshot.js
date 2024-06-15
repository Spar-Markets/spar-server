const express = require("express");
const router = express.Router();
const Match = require("../models/Match");

router.post("/getSnapshots", async (req, res) => {
  try {
    console.log("getSnapshots: hit endpoint");
    const { matchID } = req.body;

    const match = await Match.findOne({ matchID: matchID });

    const response = {
      user1ID: match.user1.userID,
      user1Snapshots: match.user1.snapshots,
      user2ID: match.user2.userID,
      user2Snapshots: match.user2.snapshots,
    };

    res.send(response);
  } catch (error) {
    console.log("Error on getSnapshots endpoint: " + error);
  }
});

module.exports = router;
