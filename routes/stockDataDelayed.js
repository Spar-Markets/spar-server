const express = require("express");
const router = express.Router();

const axios = require("axios");
const { polygonKey } = require("../config/constants");

const getMostRecentMarketOpenDay = require("../utility/getMostRecentMarketOpenDay");
const getPreviousDay = require("../utility/getPreviousDay");
const getCurrentPrice = require("../utility/getCurrentPrice");
const { json } = require("body-parser");

/**
 * STOCK DATA
 */

function getMillisecondsForTime(dateString, hour, minute) {
  // Create a Date object from the provided date string (assumed to be in UTC)
  console.log("Get Millis", dateString, hour, minute);
  const date = new Date(dateString);
  date.setHours(hour);
  date.setMinutes(minute);
  // Return the timestamp in milliseconds
  return date.getTime();
}

// Utility function to format date as yyyy-mm-dd
function closeformatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Assuming polygonKey and other required variables are defined somewhere in your code
router.post("/closeEndpoint", async (req, res) => {
  try {
    console.log("Close Endpoint called");
    const { ticker } = req.body;

    let now = new Date(Date.now());

    // Subtract two days (if necessary, adjust based on your market day calculation logic)

    console.log("This is the date for two days ago", now);
    // oneCloseAgo.setDate(oneCloseAgo.getDate() - 1);
    const recentClose = getMostRecentMarketOpenDay(now);
    recentClose.setDate(recentClose.getDate() - 1);
    const closeComparison = getMostRecentMarketOpenDay(recentClose);
    const formattedDate = closeformatDate(closeComparison);

    console.log(
      "This is two closes ago in a date, hopefully Thursday for this test:",
      twoCloseAgo
    );

    const url = `https://api.polygon.io/v1/open-close/${ticker}/${formattedDate}?adjusted=true&apiKey=${polygonKey}`;

    console.log("Polygon URL request in close: " + url);

    const response = await axios.get(url);

    // Get the last price from the response data
    const closePrice = response.data.close;

    res.status(200).json({
      ticker: response.data.symbol,
      lastPrice: closePrice,
    });
  } catch (error) {
    console.error("There is an error in closeEndpoint:", error.message);
    console.error(error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Eendpoint to get one day stock prices for most recent day where market is open
router.post("/getMostRecentOneDayPrices", async (req, res) => {
  //timeframe is optional
  const { ticker, isOneDayData } = req.body; // req.body will contain the array sent by Axios
  const tickers = [ticker];
  const now = new Date(Date.now());
  let mostRecentMarketDay = getMostRecentMarketOpenDay(now);
  // edge case. if most recent market day is today, AND it is before 9:45am, go for the previous day before that
  const isSameDay =
    now.getFullYear() === mostRecentMarketDay.getFullYear() &&
    now.getMonth() === mostRecentMarketDay.getMonth() &&
    now.getDate() === mostRecentMarketDay.getDate();
  const isBeforeMarketHours =
    now.getUTCHours() < 13 || (now.getUTCHours() == 9 && now.getMinutes() < 45);
  if (isSameDay && isBeforeMarketHours) {
    mostRecentMarketDay = getPreviousDay(mostRecentMarketDay);
    mostRecentMarketDay = getMostRecentMarketOpenDay(mostRecentMarketDay);
  }
  let timeframeClose = getMillisecondsForTime(mostRecentMarketDay, 20, 0);

  console.log(
    "getMostRecentOneDayPrices",
    now.getUTCHours(),
    now.getMinutes(),
    getMostRecentMarketOpenDay(now).getUTCDate()
  );
  // most recent time where the market was open
  // if date is not today, OR it's not within market hours, put in 4pm for mostRecentMarketTime. otherwise give it right now.

  // Case 1. if it's before market hours, if it's past 4pm, or if recent market day is another day, set most recent market time to 4pm
  if (
    isBeforeMarketHours ||
    now.getUTCHours() > 20 ||
    now.getUTCDate() != mostRecentMarketDay.getUTCDate()
  ) {
    console.log("MOST RECENT MARKET DAY", mostRecentMarketDay);
    timeframeClose = getMillisecondsForTime(mostRecentMarketDay, 20, 0);
  }

  // Case 2. if it's within market hours on the same market day, set most recent market time to right now
  else {
    timeframeClose = getMillisecondsForTime(
      mostRecentMarketDay,
      now.getUTCHours(),
      now.getUTCMinutes()
    );
  }

  const getChartData = async (timeframe) => {
    const now = Date.now();
    if (timeframe == "1D") {
      // Gets the time for 1 day ago
      desiredOpenDay = mostRecentMarketDay;
      range = "5/minute";
    } else if (timeframe == "1W") {
      // Gets the time for 1 week ago
      desiredOpenDay = now - 14400000 - 518400000;
      range = "30/minute";
    } else if (timeframe == "1M") {
      // Gets the time for one month ago
      desiredOpenDay = now - 14400000 - 2628000000;
      range = "1/hour";
    } else if (timeframe == "3M") {
      // Gets the time for 3 months ago
      desiredOpenDay = now - 14400000 - 2628000000 * 3;
      range = "1/day";
    } else if (timeframe == "YTD") {
      // Finds what year it is then gets the first day
      function getYearFromUnixTime(unixTime) {
        const date = new Date(unixTime);
        return date.getFullYear();
      }

      function getFirstDayOfYear(unixTime) {
        const year = getYearFromUnixTime(unixTime);
        // Create the first day of the year in UTC
        const firstDayOfYearUTC = new Date(Date.UTC(year, 0, 1));
        return firstDayOfYearUTC;
      }

      desiredOpenDay = getFirstDayOfYear(now);
      range = "1/day";
    } else if (timeframe == "1Y") {
      // Gets the time for 1 year ago
      desiredOpenDay = now - 14400000 - 2628000000 * 12;
      range = "1/day";
    } else if (timeframe == "5Y") {
      // Gets the time for 5 years ago
      desiredOpenDay = now - 14400000 - 2628000000 * 60;
      range = "1/week";
    } else if (timeframe == "MAX") {
      // Gets the time 15 years ago
      desiredOpenDay = now - 14400000 - 2628000000 * 60 * 15;
      range = "7/day";
    }

    // passing desired open date to retrieve the most recent open day from that time and prior
    const timeframeOpenDay = getMostRecentMarketOpenDay(desiredOpenDay);

    const timeframeOpen = getMillisecondsForTime(timeframeOpenDay, 13, 30); //WHY IS THIS 9 ALL THE SUDDEN????

    // add a check for if tickers is an array otherwise throw error
    if (!Array.isArray(tickers)) {
      res
        .status(400)
        .json({ error: "invalid ticker input: tickers is not an array" });
    }

    const prices = {};

    for (let i = 0; i < tickers.length; i++) {
      console.log(i, "Stock Data Delayed, trying", tickers[i]);
      const url = `https://api.polygon.io/v2/aggs/ticker/${tickers[i]}/range/${range}/${timeframeOpen}/${timeframeClose}?adjusted=true&sort=asc&limit=49999&apiKey=${polygonKey}`;
      console.log("Polygon URL request: " + url);
      const response = await axios.get(url);
      prices[response.data.ticker] = [];

      for (let pricestamp of response.data.results) {
        prices[response.data.ticker].push({
          timeField: pricestamp.t,
          price: pricestamp.o, //look at aggregates on polygon to undetsand
        });
      }
      return prices;
    }
  };

  //Modified for stockcards, for main details page it gets all data, for stock cards it only gets 1D
  const sendData = async () => {
    const timeframes = ["1D", "1W", "1M", "3M", "YTD", "1Y", "5Y"];

    let response = {};

    if (isOneDayData != true) {
      for (const timeframe of timeframes) {
        response[timeframe] = await getChartData(timeframe);
      }
      res.send(response);
    } else {
      response["1D"] = await getChartData("1D");
      res.send(response);
    }
  };
  sendData();
});

router.get("/getCurrentPrice/:ticker", async (req, res) => {
  const ticker = req.params.ticker;
  console.log("hit getCurrentPrice endpoint with ticker:", ticker);
  try {
    const currentPrice = await getCurrentPrice(ticker);
    res.status(200).json({ currentPrice: currentPrice });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

module.exports = router;
