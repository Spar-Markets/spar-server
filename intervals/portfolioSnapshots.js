const cron = require("node-cron");
const { sparDB } = require("../config/mongoConnection");
const Match = require("../models/Match");
const axios = require("axios");
const express = require("express");
const router = express.Router();
const secondsInOneDay = 86400;
const secondsInOneHour = 3600;
const secondsIn15min = 900;
const { polygonKey } = require("../config/constants");
let counter;

async function updatePortfolioValues() {
  // grab all tickers current price
  // polygon call
  // grab current price for ALL tickers
  const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?apiKey=${polygonKey}`;
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
      //for some reason the actual match data is the first element an array
      const assets = match[0][user].assets;

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
      const realTime = Date.now();

      // create object to put in DB
      const portfolioSnapshot = {
        value: userPortfolioValue,
        timeField: timeToNearest30s,
      };

      // update in DB
      // round to nearest 30s

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
        } catch (err) {
          console.error("Error updating match:", err);
        }
      };

      updateMatchSnapshots();
    }

    function formatTime(time) {
      // !!!accounting for the 15 minute delay
      const estTime = time - 900000;

      // milliseconds in 30 seconds
      const millisIn30s = 30000;

      // round est time to nearest 30s
      return Math.round(estTime / millisIn30s) * millisIn30s;
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
  console.log("Running cron schedule");
  //this is the 15 min delay
  const now = new Date(Date.now() - 900000);
  // convert to EST
  const hours = now.getHours();
  const minutes = now.getMinutes();
  // Ensure it's within the specific time range
  // only runs if it is weekend and within market hours
  if (
    now.getUTCDate() != getMostRecentMarketOpenDay(now).getUTCDate() ||
    (hours === 13 && minutes >= 45) ||
    (hours === 20 && minutes <= 15) ||
    (hours > 13 && hours < 20)
  ) {
    console.log(
      "Running the scheduled task, because we are in correct time range"
    );
    // Add your task here
    updatePortfolioValues();
  }
});

module.exports = { portfolioInterval };
