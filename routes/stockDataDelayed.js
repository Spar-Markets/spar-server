const express = require("express");
const router = express.Router();

const axios = require("axios");
const { polygonKey } = require("../config/constants");

const getMostRecentMarketOpenDay = require("../utility/getMostRecentMarketOpenDay");

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

// Eendpoint to get one day stock prices for most recent day where market is open
router.post("/getMostRecentOneDayPrices", async (req, res) => {
  //timeframe is optional
  const { ticker, isOneDayData } = req.body; // req.body will contain the array sent by Axios
  const tickers = [ticker];
  // set time to 15 minutes ago
  const delayedNow = new Date(Date.now() - 900000);
  let mostRecentMarketDay = getMostRecentMarketOpenDay(delayedNow);
  let mostRecentMarketTime = getMillisecondsForTime(mostRecentMarketDay, 20, 0);

  console.log(
    "cream",
    delayedNow.getUTCHours(),
    delayedNow.getUTCMinutes(),
    getMostRecentMarketOpenDay(delayedNow).getUTCDate()
  );
  // most recent time where the market was open
  // if date is not today, OR it's not within market hours, put in 4pm for mostRecentMarketTime. otherwise give it right now.
  // 1. if time - 15 mins is before 9:30am, show previous day
  if (
    delayedNow.getUTCHours() < 13 ||
    (delayedNow.getUTCHours() == 13 && delayedNow.getUTCMinutes() < 30)
  ) {
    // set most recent market day to PREVIOUS market day, not today
    mostRecentMarketDay = getMostRecentMarketOpenDay(delayedNow);
    console.log("MOST RECENT MARKET DAY", mostRecentMarketDay);
    mostRecentMarketTime = getMillisecondsForTime(mostRecentMarketDay, 20, 0);
  }

  // // 2. if it's past 4pm, set most recent market time to 4pm
  else if (delayedNow.getUTCHours() > 20) {
    mostRecentMarketTime = getMillisecondsForTime(mostRecentMarketDay, 20, 0);
  }

  // MISSED THE WEEKEND
  else if (
    delayedNow.getUTCDate != getMostRecentMarketOpenDay(delayedNow).getUTCDate()
  ) {
    weekendCalc = getMostRecentMarketOpenDay(delayedNow);
    mostRecentMarketTime = getMillisecondsForTime(weekendCalc, 20, 0);
  }
  // // 4. if it's within market hours, set most recent market time to right now
  else {
    mostRecentMarketTime = getMillisecondsForTime(
      mostRecentMarketDay,
      delayedNow.getUTCHours(),
      delayedNow.getUTCMinutes()
    );
  }

  const getChartData = async (timeframe) => {
    const now = Date.now();
    if (timeframe == "1D") {
      // Gets the time for 1 day ago
      desiredOpenDay = now - 14400000;
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
    const mostRecentMarketDay = getMostRecentMarketOpenDay(desiredOpenDay);
    console.log(
      "stockdatadelayed; this is the most recent market day",
      mostRecentMarketDay,
      timeframe
    );

    const recentMarketOpen = getMillisecondsForTime(mostRecentMarketDay, 9, 30); //WHY IS THIS 9 ALL THE SUDDEN????
    console.log("stockdatadelayed", recentMarketOpen);

    // add a check for if tickers is an array otherwise throw error
    if (!Array.isArray(tickers)) {
      res
        .status(400)
        .json({ error: "invalid ticker input: tickers is not an array" });
    }

    const prices = {};

    for (let i = 0; i < tickers.length; i++) {
      console.log(i, "Stock Data Delayed, trying", tickers[i]);
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
