const express = require("express");
const router = express.Router();
import Match from "../models/Match"

router.post("/purchaseStock", async (req, res) => {
  try {
    const { email, matchId, buyPrice, ticker } = req.body;
    const match = await Match.findOne({ matchId: matchId });

    if (!match) {
      return res.status(404).send("Match not found");
    }

    let updateField;
    if (match.user1.email === email) {
      updateField = "user1.assets";
    } else if (match.user2.email === email) {
      updateField = "user2.assets";
    } else {
      return res.status(400).send("User not found in this match");
    }

    const updatedMatch = await Match.findOneAndUpdate(
      { matchId: matchId },
      { $push: { [updateField]: { ticker: ticker, buyPrice: buyPrice } } },
      { new: true }
    );

    res.status(200).send(updatedMatch);
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred while processing the request");
  }
});

module.exports = router;
