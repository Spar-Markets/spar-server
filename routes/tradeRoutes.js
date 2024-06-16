const express = require("express");
const router = express.Router();
const Match = require("../models/Match");

router.post("/purchaseStock", async (req, res) => {
  try {
    console.log("purchaseStock: hit endpoint");
    const { userID, matchID, ticker, buyPrice, shares } = req.body;
    console.log(
      "purchaseStock: received request: ",
      userID,
      matchID,
      ticker,
      buyPrice,
      shares
    );
    const match = await Match.findOne({ matchID: matchID });
    console.log("purchaseStock: got match: ", match);
    now = Date.now();
    if (!match) {
      console.log("purchaseStock: MATCH NOT FOUND");
      return res.status(404).send("Match not found");
    }
    console.log("purchaseStock: match found");

    let user;
    if (match.user1.userID === userID) {
      user = "user1";
    } else if (match.user2.userID === userID) {
      user = "user2";
    } else {
      return res.status(400).send("User not found in this match");
    }

    // TODO: Update buying power

    const updatedMatchTrades = await Match.findOneAndUpdate(
      { matchID: matchID },
      {
        $push: {
          [`${user}.trades`]: {
            ticker: ticker,
            buyPrice: buyPrice,
            time: now,
            shares: shares,
          },
        },
      },
      { new: true }
    );

    console.log("about to check if has asset");
    // check if ticker is inside of asset
    const asset = match[user].assets.find((asset) => asset.ticker === ticker);
    if (asset) {
      // get share amount and average cost basis
      const { totalShares, avgCostBasis } = asset;

      // calculate correct share amount and avaerage cost basis
      const updatedTotalShares = totalShares + shares;
      const updatedAvgCostBasis =
        (avgCostBasis * totalShares + buyPrice * shares) / updatedTotalShares;

      // define new fields for assets
      const newFields = {
        ticker: ticker,
        totalShares: updatedTotalShares,
        avgCostBasis: updatedAvgCostBasis,
      };

      // update share amount and average cost basis
      const updatedMatchAssets = await Match.updateOne(
        // grabs doc with matchID and queries for object in "assets" array that matches ticker
        { matchID, [`${user}.assets.ticker`]: ticker },
        // sets the queried object to have the new fields defined above
        { $set: { [`${user}.assets.$`]: newFields } }
      );

      returnData = {
        updatedMatchTrades,
        updatedMatchAssets,
      };
      console.log("They have this ticker inside assets");
    } else {
      console.log("THey do NOT have this ticker");
      // write new asset to DB

      const newFields = {
        ticker: ticker,
        totalShares: shares,
        avgCostBasis: buyPrice,
      };

      const updatedMatchAssets = await Match.updateOne(
        // grabs doc with matchID and queries for object in "assets" array that matches ticker
        { matchID },
        // sets the queried object to have the new fields defined above
        { $push: { [`${user}.assets`]: newFields } }
      );

      console.log("Updated match assets:", updatedMatchAssets);

      returnData = {
        updatedMatchAssets,
        updatedMatchTrades,
      };
    }

    res.status(200).send(returnData);
  } catch (error) {
    console.error("Error in purchaseStock endpoint:", error);
    res
      .status(500)
      .send("An error occurred while processing the purchaseStock request");
  }
});

router.post("/sellStock", async (req, res) => {
  try {
    // sell stock logic
  } catch (error) {
    console.error("Error in purchaseStock endpoint:", error);
    res
      .status(500)
      .send("An error occurred while processing the purchaseStock request");
  }
});

module.exports = router;
