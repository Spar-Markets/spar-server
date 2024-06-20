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
  //timeframe is optional
  const { ticker, isOneDayData } = req.body; // req.body will contain the array sent by Axios
  const tickers = [ticker];
  const delayedNow = new Date(Date.now() - 900000); /*- 14400000*/
  let mostRecentMarketDay = getMostRecentMarketOpenDay(delayedNow);
  let mostRecentMarketTime = getMillisecondsForTime(mostRecentMarketDay, 20, 0);

  // most recent time where the market was open
  // if date is not today, OR it's not within market hours, put in 4pm for mostRecentMarketTime. otherwise give it right now.
  // 1. if time - 15 mins is before 9:30am, show previous day
  if (
    delayedNow.getUTCHours() < 13 ||
    (delayedNow.getUTCHours() == 13 && delayedNow.getUTCMinutes() < 30)
  ) {
    // set most recent market day to PREVIOUS market day, not today
    mostRecentMarketDay = getMostRecentMarketOpenDay(
      new Date(delayedNow - 86400000)
    );
    mostRecentMarketTime = getMillisecondsForTime(mostRecentMarketDay, 20, 0);
  }

  // // 2. if it's past 4pm, set most recent market time to 4pm
  else if (delayedNow.getUTCHours() > 20) {
    mostRecentMarketTime = getMillisecondsForTime(mostRecentMarketDay, 20, 0);
  }

  // // 3. if it's within market hours, set most recent market time to right now
  else {
    mostRecentMarketTime = getMillisecondsForTime(
      mostRecentMarketDay,
      delayedNow.getUTCHours(),
      delayedNow.getUTCMinutes()
    );
  }

  const recentMarketOpen = getMillisecondsForTime(mostRecentMarketDay, 13, 30);

  const getChartData = async (timeframe) => {
    const now = Date.now();
    if (timeframe == "1D") {
      // Gets the time for 1 day ago
      desiredOpenDay = now - 14400000;
      range = "1/minute";
    } else if (timeframe == "1W") {
      // Gets the time for 1 week ago
      desiredOpenDay = now - 14400000 - 518400000;
      range = "5/minute";
    } else if (timeframe == "1M") {
      // Gets the time for one month ago
      desiredOpenDay = now - 14400000 - 2628000000;
      range = "30/minute";
    } else if (timeframe == "3M") {
      // Gets the time for 3 months ago
      desiredOpenDay = now - 14400000 - 2628000000 * 3;
      range = "2/hour";
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
      range = "4/hour";
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

    const mostRecentMarketDay = getMostRecentMarketOpenDay(desiredOpenDay);
    const recentMarketOpen = getMillisecondsForTime(
      mostRecentMarketDay,
      13,
      30
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
      const url = `https://api.polygon.io/v2/aggs/ticker/${tickers[i]}/range/${range}/${recentMarketOpen}/${mostRecentMarketTime}?adjusted=true&sort=asc&limit=49999&apiKey=${polygonKey}`;
      console.log("Polygon URL request: " + url);
      const response = await axios.get(url);
      prices[response.data.ticker] = [];

      for (let pricestamp of response.data.results) {
        prices[response.data.ticker].push({
          timeField: pricestamp.t,
          price: pricestamp.c,
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

module.exports = router;
