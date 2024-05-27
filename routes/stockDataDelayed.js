const express = require("express");
const router = express.Router();

const axios = require("axios");
const polygonKey = "_4BtZn3PRCLu6fsdu7dgddb4ucmB1sfp";

const isMarketOpenToday = require("../utility/isMarketOpenToday");

/**
 * STOCK DATA
 */

// cache for prices for each ticker, updated whenever new price is written to DB
// 1. so that we only write to DB if price is new (minimize write operations)
// 2. to not read directly from DB to check whether price is new (minimize read operations)
const priceCache = {};

const getCurrentPrice = async (ticker) => {
  // constants
  let hoursAgo = 24;
  let millisAgo = hoursAgo * 60 * 60 * 1000;
  const now = Date.now();
  const timestamp1 = now - millisAgo - 60000;
  const timestamp2 = now - millisAgo + 60000;

  // get price from 24h ago timestamp
  const response = await axios.get(
    `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/minute/${timestamp1}/${timestamp2}?adjusted=true&sort=asc&limit=1000&apiKey=${polygonKey}`
  );

  if (response.data.queryCount == 0 || response.data.resultsCount == 0) {
    console.error("No data was found for specified timestamp.");
    return null;
  }

  const data = response.data.results;

  const closestBefore = data.reduce((prev, curr) => {
    // Ignore objects where `t` is not before `time`
    if (curr.t > timestamp1) return prev;
    // If prev is null (initial state) or the current object's `t` is closer to `time`, update prev
    return prev === null ||
      Math.abs(curr.t - timestamp1) < Math.abs(prev.t - timestamp1)
      ? curr
      : prev;
  }, null);

  return { timeField: closestBefore.t, price: closestBefore.c };
};

const updateCurrentPrice = async (ticker) => {
  const newPrice = await getCurrentPrice(ticker);
  try {
    const cachedPrice = priceCache[ticker];

    // write price to DB if price is changed or not cached
    if (
      !cachedPrice ||
      cachedPrice.price !== newPrice.price ||
      cachedPrice.timeField !== newPrice.timeField
    ) {
      // update the cache
      priceCache[ticker] = newPrice;
      console.log("Updated", ticker, ". New price: ", newPrice);
    } else {
      console.log(
        "Price for",
        ticker,
        "not updated because price hasn't changed."
      );
    }
  } catch (error) {
    console.error("Error updating price: ", error);
  }
};

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

// Function to get the previous day
function getPreviousDay(date) {
  const previousDay = new Date(date);
  console.log("date!?",previousDay.getDate())
  previousDay.setDate(previousDay.getDate() - 1);
  console.log(previousDay)
  return previousDay;
}

// get most recent market open day
function getMostRecentMarketOpenDay(now) {
  console.log("this is what is being fed in", now)
  let previousDate = getPreviousDay(now);
  console.log("this is what is being fed in for prevDate", previousDate)
  while (!isMarketOpenToday(previousDate)) {
    previousDate = getPreviousDay(previousDate);
  }
  console.log("this is what it thinks is previous market open date", previousDate)
  return previousDate;
}

// // get milliseconds for a specified date, hour, and minute
// function getMilliseconds(dateString, hour, minute) {
//   // Create a Date object from the provided date string
//   const date = new Date(dateString);

//   // Set the provided hour and minute
//   date.setHours(hour, minute, 0, 0);

//   // Return the timestamp in milliseconds
//   return date.getTime();
// }



function getMillisecondsEDT(dateString, hour, minute) {
  // Create a Date object from the provided date string (assumed to be in UTC)
  const date = new Date(dateString);

  // Calculate the time zone offset for EDT (UTC-4)
  const offset = -4 * 60; // -4 hours in minutes

  // Convert the UTC date to local time (EDT)
  const localTime = new Date(date.getTime() + offset * 60 * 1000);

  // Set the provided hour and minute in local time (EDT)
  localTime.setHours(hour, minute, 0, 0);

  // Return the timestamp in milliseconds
  return localTime.getTime();
}












router.get("/getStockPrice", async (req, res) => {
  const { ticker } = req.query;
  if (!ticker) {
    return res.status(400).json({ error: "Ticker is required" });
  } else if (!isWithinMarketHours()) {
    return res.status(400).json({ error: "Outside market hours" });
  }

  try {
    const stockData = await getCurrentPrice(ticker);
    res.json(stockData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stock price" });
  }
});

// endpoint to get one day stock prices for most recent day where market is open
router.post("/getMostRecentOneDayPrices", async (req, res) => {
  
  const tickers = req.body; // req.body will contain the array sent by Axios
  console.log("Stock request coming in:", tickers)
  const now = Date.now();
  console.log("The time right now, this should be correct:", now)
  const mostRecentMarketDay = getMostRecentMarketOpenDay(now);
  console.log("Printing what the most recent market day is:", mostRecentMarketDay)
  const recentMarketOpen = getMillisecondsEDT(mostRecentMarketDay, 13, 30);
  const recentMarketClose = getMillisecondsEDT(mostRecentMarketDay, 20, 0);

  console.log("getMostRecentMarketOpenDay", recentMarketClose, recentMarketOpen)

  // add a check for if tickers is an array otherwise throw error
  if (!Array.isArray(tickers)) {
    res
      .status(400)
      .json({ error: "invalid ticker input: tickers is not an array" });
  }

  const prices = {};

  for (let i = 0; i < tickers.length; i++) {
    console.log(i, "trying", tickers[i])
    const url = `https://api.polygon.io/v2/aggs/ticker/${tickers[i]}/range/5/minute/${recentMarketOpen}/${recentMarketClose}?adjusted=true&sort=asc&apiKey=${polygonKey}`;
    const response = await axios.get(url);
    prices[response.data.ticker] = [];
    
    for (let pricestamp of response.data.results) {
      prices[response.data.ticker].push({
        timeField: pricestamp.t,
        price: pricestamp.c,
      });
    }
  }
  res.json(prices);
});

setInterval(async () => {
  if (isWithinMarketHours()) {
    updateCurrentPrice("AAPL");
    updateCurrentPrice("GOOG");
    updateCurrentPrice("TSLA");
  } else {
    console.log("Outside market hours. Skipping function.");
  }
}, 20000);

module.exports = router;
