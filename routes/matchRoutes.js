const express = require("express");
const router = express.Router();
const MatchSnapshots = require("../models/MatchSnapshots");
const MatchHistory = require("../models/MatchHistory");

router.post("/getSnapshots", async (req, res) => {
    try {
        console.log("getSnapshots: hit endpoint");
        const { matchID } = req.body;

        const snapshots = await MatchSnapshots.findOne({ matchID: matchID });

        const response = {
            user1Snapshots: snapshots.user1Snapshots,
            user2Snapshots: snapshots.user2Snapshots,
        };

        res.send(response);
    } catch (error) {
        console.log("Error on getSnapshots endpoint: " + error);
    }
});

/**
 * TODO: pastMatch refactor
 */
router.post("/getPastMatch", async (req, res) => {
    try {
        const { matchID } = req.body;
        const userMatchHistory = await MatchHistory.findOne({ userID: match.winnerUserID });
        const match = userMatchHistory.pastMatches.find(match => match.matchID == matchID);
        if (match) {
            res.status(200).json({ match: match });
        } else {
            res.status(400).send("Match not found");
        }
    } catch (error) {
        console.error("Error in /getPastMatch:", error);
        res.status(500).send(error);
    }
})

module.exports = router;