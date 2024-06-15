const cron = require("node-cron");
const { sparDB } = require("../config/mongoConnection");
const Match = require("../models/Match");
const axios = require("axios");
const express = require("express");
const router = express.Router();
const secondsInOneDay = 86400;
const secondsInOneHour = 3600;
const secondsIn15min = 900;
let counter;

async function updatePortfolioValues() {
  // grab all tickers current price
  // polygon call
  // grab current price for ALL tickers
  const url =
    "https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?apiKey=vLyw12bgkKE1ICVMl72E4YBpJwpmmCwh";
  const allTickers = await axios.get(url);
  counter = counter + 1;
  // grab every match in mongo that meets timeframe condition

  // always add to 15 min
  let matches = [];
  matches.push(await Match.find({ timeframe: secondsIn15min }));
  if (counter % 2 == 0) {
    matches.push(await Match.find({ timeframe: secondsInOneHour }));
  }

  if (counter % 10 == 0) {
    matches.push(await Match.find({ timeframe: secondsInOneDay }));
  }

  // for each match:
  // for each user in match:
  matches.forEach((match) => {
    function updateUserPortfolio(user) {
      console.log("Portfolio Snapshots:", match);
      //console.log("match user object portfolio snapshots 39 " + match);
      // do user assets

      //for some reason the actual match data is the first element an array
      const assets = match[0][user].assets;
      console.log("Portfolio Snapshots:", assets);

      // calculate gain/loss on each stock
      let sharesValue = 0;

      // for each of users assets:
      assets.forEach((asset) => {
        // get current price of asset
        const { ticker, totalShares, avgCostBasis } = asset;

        // In the array of ticker objects from polygon, find the one with the same ticker as this asset

        //had to add .data to work
        const tickerObject = allTickers.data.tickers.find(
          (object) => object.ticker == ticker
        );

        // grab last price: current
        const lastPrice = tickerObject.min.c;

        // calculate value of their asset
        sharesValue += totalShares * lastPrice;
      });

      // user's portfolio value
      const userPortfolioValue = match[0][user].buyingPower + sharesValue;

      const timeToNearest30s = formatTime(Date.now());

      // create object to put in DB
      const portfolioSnapshot = {
        value: userPortfolioValue,
        timeField: timeToNearest30s,
      };

      console.log("Portfolio Snapshot for", user + ":", portfolioSnapshot);

      // update in DB
      // round to nearest 30s
      // push { value: value, timeField: time }
      /*Match.updateOne(
        { matchID: match[0].matchID },
        {
          // push in portfolio snapshot to snapshots array
          $push: { [`${user}.snapshots`]: portfolioSnapshot },
          // make sure snapshots array exists
          $setOnInsert: { [`${user}.snapshots`]: [] },
        },
        { upsert: true }
      );*/

      const updateMatchSnapshots = async () => {
        try {
          // Step 1: Ensure the snapshots array exists
          //await initializeSnapshotsArray(match, user);

          // Step 2: Push the new snapshot to the snapshots array
          const result = await Match.findOneAndUpdate(
            { matchID: match[0].matchID },
            { $push: { [`${user}.snapshots`]: portfolioSnapshot } },
            { upsert: true, returnDocument: "after" }
          );
          console.log("Match updated successfully:", result);
        } catch (err) {
          console.error("Error updating match:", err);
        }
      };

      updateMatchSnapshots();
    }

    function formatTime(time) {
      // round time to nearest 30s
      // !!!accounting for the 15 minute delay
      time = time - 15 * 60 * 1000;
      return (time / (1000 * 30)) * (1000 * 30);
    }

    updateUserPortfolio("user1");
    updateUserPortfolio("user2");
  });

  // calculate portfolio values:
  // 1. grab all assets for user
  // 2. calculate the $ gain/loss on each stock based on buyPrice, shares, and currentPrice
  // 3. add the users buyingPower to their stock PnL
  // 4. append that johnson to the portfolio snapshots array, along with a timeField for current timestamp
}

const portfolioInterval = cron.schedule("*/30 * * * * *", () => {
  console.log("Running interval in portfolioSnapshots");
  const now = new Date();
  // convert to EST
  const hours = now.getHours() - 6;
  const minutes = now.getMinutes();
  console.log("minutes:", minutes + ", hours", hours);
  //minutes: 50, hours 17
  // Ensure it's within the specific time range
  if (
    (hours === 9 && minutes >= 45) ||
    (hours === 16 && minutes <= 15) ||
    (hours > 9 && hours < 16)
  ) {
    console.log(
      "Running the scheduled task, because we are in correct time range:",
      new Date().toLocaleTimeString()
    );
    // Add your task here
    updatePortfolioValues();
  }
});

module.exports = { portfolioInterval };
