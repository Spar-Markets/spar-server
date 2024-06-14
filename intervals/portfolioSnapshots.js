const cron = require("node-cron");
const { sparDB } = require("../config/mongoConnection");
const Match = require("../models/Match");
const axios = require("axios");

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
      // do user assets
      const assets = match[user].assets;

      // calculate gain/loss on each stock
      let sharesValue = 0;

      // for each of users assets:
      assets.forEach((asset) => {
        // get current price of asset
        const { ticker, totalShares, avgCostBasis } = asset;

        // In the array of ticker objects from polygon, find the one with the same ticker as this asset
        const tickerObject = alltickers.tickers.find(
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

      // create object to put in DB
      const portfolioSnapshot = {
        value: userPortfolioValue,
        timeField: timeToNearest30s,
      };

      // update in DB
      // round to nearest 30s
      // push { value: value, timeField: time }
      Match.updateOne(
        { matchID: match.matchID },
        {
          // push in portfolio snapshot to snapshots array
          $push: { [`${user}.snapshots`]: portfolioSnapshot },
          // make sure snapshots array exists
          $setOnInsert: { [`${user}.snapshots`]: [] },
        },
        { upsert: true }
      );
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

cron.schedule();
