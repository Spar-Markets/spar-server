const express = require("express");
const router = express.Router();
const Match = require("../models/Match");
const getCurrentPrice = require("../utility/getCurrentPrice");

router.post("/purchaseStock", async (req, res) => {
  try {
    // TODO: shares
    console.log("purchaseStock: hit endpoint");
    const { userID, matchID, ticker, type } = req.body;


    const match = await Match.findOne({ matchID: matchID });
    //console.log("purchaseStock: got match: ", match);
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

    // get current price
    const buyPrice = await getCurrentPrice(ticker);
    console.log(`purchaseStock: current price of ${ticker}: ${buyPrice}`);

    // check how much this trade will cost
    // determine trade cost based on type (shares or dollars)
    const shares = (type == "shares") ? req.body.shares : parseFloat(req.body.dollars) / parseFloat(buyPrice);
    const tradeCost = (type == "shares") ? parseFloat(buyPrice) * parseFloat(shares) : parseFloat(req.body.dollars);
    console.log("purchaseStock: trade cost:", tradeCost);

    if (match[user].buyingPower < tradeCost) {
      console.log("purchaseStock: not enough buying power");
      return res
        .status(404)
        .send("Buy order failed: not enough buying power to execute order");
    } else {
      // update buying power
      console.log(
        "purchaseStock: updating buying power from:",
        match[user].buyingPower
      );
      match[user].buyingPower -= tradeCost;
      console.log(
        "purchaseStock: updated buying power to:",
        match[user].buyingPower
      );
    }

    // Save the match with updated buying power
    await Match.updateOne(
      { matchID: matchID },
      { $set: { [`${user}.buyingPower`]: match[user].buyingPower } }
    );

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

    console.log("purchaseStock: About to check if has asset");
    // check if ticker is inside of asset
    const asset = match[user].assets.find((asset) => asset.ticker === ticker);
    if (asset) {
      console.log("purchaeStock: Bro DOES have an asset for ticker", ticker);
      console.log("purchaseStock: Here is bro's asset:", asset)
      // get share amount and average cost basis
      const { totalShares, avgCostBasis } = asset;

      // calculate correct share amount and avaerage cost basis
      const updatedTotalShares = parseFloat(totalShares) + parseFloat(shares);

      // define new fields for assets
      const newFields = {
        ticker: ticker,
        totalShares: parseFloat(updatedTotalShares),
        avgCostBasis: asset.avgCostBasis,
      };

      // update share amount and average cost basis
      const updatedMatchAssets = await Match.updateOne(
        // grabs doc with matchID and queries for object in "assets" array that matches ticker
        { matchID, [`${user}.assets.ticker`]: ticker },
        // sets the queried object to have the new fields defined above
        { $set: { [`${user}.assets.$`]: newFields } }
      );

      returnData = {
        updatedTotalShares,
        buyPrice,
        avgCostBasis: asset.avgCostBasis,
        date: Date.now(),
        shares,
        tradeCost
      };

      console.log("HELLO JACKSON HERE IS THE RETURN DATA:", returnData);
    } else {
      console.log("purchaseStock: bro does NOT have this ticker");
      // write new asset to DB

      const newFields = {
        ticker: ticker,
        totalShares: parseFloat(shares),
        avgCostBasis: buyPrice,
      };

      const updatedMatchAssets = await Match.updateOne(
        // grabs doc with matchID and queries for object in "assets" array that matches ticker
        { matchID },
        // sets the queried object to have the new fields defined above
        { $push: { [`${user}.assets`]: newFields } }
      );

      returnData = {
        updatedTotalShares: shares,
        buyPrice,
        date: Date.now(),
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
    console.log("sellStock: hit endpoint");
    const { userID, matchID, ticker, shares } = req.body;
    console.log(
      "sellStock: received request: ",
      userID,
      matchID,
      ticker,
      shares
    );

    const match = await Match.findOne({ matchID: matchID });
    //console.log("purchaseStock: got match: ", match);

    // determine whether match exists
    now = Date.now();
    if (!match) {
      console.log("sell: MATCH NOT FOUND");
      return res.status(404).send("Match not found");
    }
    console.log("sellStock: match found");

    // determine user 1 an duser 2
    let user;
    if (match.user1.userID === userID) {
      user = "user1";
    } else if (match.user2.userID === userID) {
      user = "user2";
    } else {
      return res.status(400).send("User not found in this match");
    }

    // get current price
    const sellPrice = await getCurrentPrice(ticker);
    console.log(`sellStock: current price of ${ticker}: ${sellPrice}`);

    // check how much this trade will be worth
    const tradeCredit = parseFloat(sellPrice) * parseFloat(shares);
    console.log("sellStock: trade cost:", tradeCredit);

    // find the asset to sell
    const sellAsset = match[user].assets.find(
      (asset) => asset.ticker === ticker
    );
    //return asset ? asset.totalShares : undefined;

    // make sure user owns the asset
    if (!sellAsset) {
      return res.status(500).send("User does not own asset");
    }

    // check whetehr they have enough shares
    if (shares > sellAsset.totalShares) {
      console.log("selling stock: not enough shares");
      return res
        .status(404)
        .send("Sell order failed: not enough shares to execute order");
    }

    // update buying power
    console.log(
      "selling Stock: updating buying power from:",
      match[user].buyingPower
    );
    match[user].buyingPower += tradeCredit;
    console.log(
      "selling Stock: updated buying power to:",
      match[user].buyingPower
    );

    // Save the match with updated buying power
    await Match.updateOne(
      { matchID: matchID },
      { $set: { [`${user}.buyingPower`]: match[user].buyingPower } }
    );

    // update trades array
    const updatedMatchTrades = await Match.findOneAndUpdate(
      { matchID: matchID },
      {
        $push: {
          [`${user}.trades`]: {
            ticker: ticker,
            sellPrice: sellPrice,
            time: now,
            shares: shares,
          },
        },
      },
      { new: true }
    );

    console.log("About to check if has asset");
    // check if ticker is inside of asset

    // get share amount and average cost basis
    const { totalShares } = sellAsset;

    // calculate correct share amount and avaerage cost basis
    const updatedTotalShares = parseFloat(totalShares) - parseFloat(shares);

    // check whether they sell all of their shares
    if (shares >= totalShares) {
      console.log("We boutta delete the whole asset baby");
      // remove asset from user's assets
      // this filters out all assets with a matching ticker
      match[user].assets = match[user].assets.filter(
        (asset) => asset.ticker != ticker
      );

      // update assets for user
      const updatedMatchAssets = await Match.updateOne(
        { matchID: matchID },
        { $set: { [`${user}.assets`]: match[user].assets } }
      );

      // return successful
      returnData = {
        updatedTotalShares: totalShares - shares,
        sellPrice,
        date: Date.now(),
      };

      return res.status(200).send(returnData);
    }

    // define new fields for assets
    returnData = {
      updatedTotalShares: totalShares - shares,
      sellPrice,
      date: Date.now(),
    };
    // update share amount and average cost basis
    const updatedMatchAssets = await Match.updateOne(
      // grabs doc with matchID and queries for object in "assets" array that matches ticker
      { matchID, [`${user}.assets.ticker`]: ticker },
      // update the total shares of this johnny
      { $set: { [`${user}.assets.$.totalShares`]: totalShares - shares } }
    );

    return res.status(200).send(returnData);
  } catch (error) {
    console.error("Error in /sellStock endpoint:", error);
    res
      .status(500)
      .send("An error occurred while processing the /sellStock request");
  }
});

module.exports = router;
