const express = require("express");
const router = express.Router();

const axios = require("axios");
const { polygonKey } = require("../config/constants");

const getMostRecentMarketOpenDay = require("../utility/getMostRecentMarketOpenDay");

/**
 * STOCK DATA
 */

// cache for prices for each ticker, updated whenever new price is written to DB
// 1. so that we only write to DB if price is new (minimize write operations)
// 2. to not read directly from DB to check whether price is new (minimize read operations)
const priceCache = {};

const isWithinMarketHours = () => {
  const startHour = 9;
  const startMinute = 30;
  const endHour = 16;
  const endMinute = 0;

  const now = new Date();

  // Convert to EST
  const options = {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  };
  const estTimeString = now.toLocaleTimeString("en-US", options);
  const [currentHour, currentMinute] = estTimeString.split(":").map(Number);

  // Get the current day of the week in EST
  const estDateString = now.toLocaleDateString("en-US", {
    timeZone: "America/New_York",
  });
  const estDate = new Date(estDateString);
  const currentDay = estDate.getDay(); // 0 (Sunday) to 6 (Saturday)

  // Check if current time is within the specified range
  const afterStart =
    currentHour > startHour ||
    (currentHour === startHour && currentMinute >= startMinute);
  const beforeEnd =
    currentHour < endHour ||
    (currentHour === endHour && currentMinute <= endMinute);
  const withinWeekdays = currentDay >= 2 && currentDay <= 6;

  return afterStart && beforeEnd && withinWeekdays;
};

// get most recent market open day

function getMillisecondsForTime(dateString, hour, minute) {
  // Create a Date object from the provided date string (assumed to be in UTC)
  console.log("getmillisecondsedt", dateString, hour, minute);
  const date = new Date(dateString);
  date.setHours(hour);
  date.setMinutes(minute);

  // Return the timestamp in milliseconds
  return date.getTime();
}

// endpoint to get one day stock prices for most recent day where market is open
router.post("/getMostRecentOneDayPrices", async (req, res) => {
  const tickers = req.body; // req.body will contain the array sent by Axios
  console.log("getMostRecentOneDayPrices, Stock request coming in:", tickers);
  const now = Date.now();
  console.log(
    "getMostRecentOneDayPrices, The time right now, this should be correct:",
    now
  );
  const mostRecentMarketDay = getMostRecentMarketOpenDay(now);
  console.log(
    "getMostRecentOneDayPrices, Printing what the most recent market day is:",
    mostRecentMarketDay
  );
  const recentMarketOpen = getMillisecondsForTime(mostRecentMarketDay, 13, 30);
  const recentMarketClose = getMillisecondsForTime(mostRecentMarketDay, 20, 0);

  console.log(
    "getMostRecentMarketOpenDay",
    recentMarketClose,
    recentMarketOpen
  );

  // add a check for if tickers is an array otherwise throw error
  if (!Array.isArray(tickers)) {
    res
      .status(400)
      .json({ error: "invalid ticker input: tickers is not an array" });
  }

  const prices = {};

  for (let i = 0; i < tickers.length; i++) {
    console.log(i, "Trying", tickers[i]);
    const url = `https://api.polygon.io/v2/aggs/ticker/${tickers[i]}/range/5/minute/${recentMarketOpen}/${recentMarketClose}?adjusted=true&sort=asc&apiKey=${polygonKey}`;
    console.log("Polygon URL request: " + url);
    const response = await axios.get(url);
    prices[response.data.ticker] = [];

    // do a check if
    for (let pricestamp of response.data.results) {
      prices[response.data.ticker].push({
        timeField: pricestamp.t,
        price: pricestamp.c,
      });
    }
  }
  res.json(prices);
});

module.exports = router;
