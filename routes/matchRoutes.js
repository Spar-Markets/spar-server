const express = require("express");
const router = express.Router();
const MatchSnapshots = require("../models/MatchSnapshots");

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

module.exports = router;