const cron = require("node-cron");
const { sparDB } = require("../config/mongoConnection");
const MatchSnapshots = require("../models/MatchSnapshots");
const Match = require("../models/Match");
const axios = require("axios");
const express = require("express");
const router = express.Router();
const isMarketOpen = require("../utility/isMarketOpen")



// constants
const millisIn15min = 900;
const millisInOneDay = 86400;
const millisInOneWeek = 604800;

const { polygonKey } = require("../config/constants");
const getMostRecentMarketOpenDay = require("../utility/getMostRecentMarketOpenDay");

/**
 * Create portfolio snapshot for a list of matches.
 * @param matches array of matches to create snapshots for
 */
async function updatePortfolioValues(matches) {
  // grab all tickers current price
  // polygon call
  // grab current price for ALL tickers
  const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?apiKey=${polygonKey}`;
  const allTickers = await axios.get(url);

  console.log("MATCHES ARRAY", matches);

  console.log(matches);

  // for each match:
  // for each user in match:
  matches.forEach((match) => {
    function updateUserPortfolio(user) {
      //for some reason the actual match data is the first element an array
      const assets = match[user].assets;

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
      const userPortfolioValue = match[user].buyingPower + sharesValue;

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
          const result = await MatchSnapshots.findOneAndUpdate(
            { matchID: match.matchID },
            { $push: { [`${user}Snapshots`]: portfolioSnapshot } },
            { new: true, upsert: true, returnDocument: "after" }
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

/**
 * Function that checks whether it is currently within market hours, then runs "updatePortfolioValues" if so.
 * @param matches Array of matches to run interval function on.
 */
function runIntervalFunction(matches) {
  console.log("grant called check 1")

  const isWithinMarketHours = isMarketOpen()
  console.log(isWithinMarketHours, "grant called check 1")
  if (isWithinMarketHours == true) {
    // console.log(
    //   `CASE 1: Running portfolio snapshots, because we are in correct time range. --- Hours: ${hours}, Minutes: ${minutes}`
    // );
    // Add your task here
    updatePortfolioValues(matches);
  } else {
    // console.log(
    //   `CASE 2: NOT running portfolio snapshots. Outside market hours. --- Hours: ${hours}, Minutes: ${minutes}`
    // );
  }
}

/**
 * Run snapshots for fifteen minute matches every 10 seconds.
 */
const fifteenMinuteInterval = cron.schedule("*/10 * * * * *", async () => {
  const fifteenMinMatches = await Match.find({ timeframe: millisIn15min });
  runIntervalFunction(fifteenMinMatches);
});

/**
 * Run snapshots for one day matches every 5 minutes.
 */
const oneDayInterval = cron.schedule("*/5 * * * *", async () => {
  const oneHourMatches = await Match.find({ timeframe: millisInOneDay });
  runIntervalFunction(oneHourMatches);
});

/**
 * Run snapshots for one week matches every 30 minutes.
 */
const oneWeekInterval = cron.schedule("*/30 * * * *", async () => {
  const oneHourMatches = await Match.find({ timeframe: millisInOneWeek });
  runIntervalFunction(oneHourMatches);
});

module.exports = { fifteenMinuteInterval, oneDayInterval, oneWeekInterval };
