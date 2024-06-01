const express = require("express");
const router = express.Router();
const Match = require("../models/Match");


// UNFINISHED
async function addOrderToTrades(matchId, orderObject, ticker, updateField) {
  try {
    const result = await Match.updateOne(
      { matchId: matchId, [`${updateField}.ticker`]: ticker },
      { $push: { [`${updateField}.$.trades`]: orderObject } }
    )

    if (result.nModified === 0) {
      console.log('No document matched or updated.');
    } else {
      console.log('Trade object added successfully.');
    }
  }
}

router.post("/purchaseStock", async (req, res) => {
  try {
    const { userID, matchId, ticker, buyPrice, shares } = req.body;
    const match = await Match.findOne({ matchId: matchId });

    if (!match) {
      return res.status(404).send("Match not found");
    }

    let updateField;
    if (match.user1.userID === userID) {
      if (match.user1.assets.includes(ticker)) updateField = "user1.assets";
    } else if (match.user2.userID === userID) {
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
