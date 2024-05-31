const express = require("express");
const router = express.Router();
const axios = require("axios");

// These routes may be obselete now since we aren't storing in database

const { polygonKey } = require("../config/constants");
const getMostRecentMarketOpenDay = require("../utility/getMostRecentMarketOpenDay");

// Gets information on a given ticker
router.post("/getTickerDetails", async function (req, res) {
  const { ticker } = req.body;

  try {
    const detailsResponse = await axios.get(
      `https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${polygonKey}`
    ); //summary, market cap, etc.

    const now = Date.now();

    const mostRecentMarketDay = getMostRecentMarketOpenDay(now);

    const year = mostRecentMarketDay.getFullYear();

    const month = String(mostRecentMarketDay.getMonth() + 1).padStart(2, "0"); // Months are zero-based

    const day = String(mostRecentMarketDay.getDate()).padStart(2, "0");

    const formattedDate = `${year}-${month}-${day}`;

    const priceDetailsResponse = await axios.get(
      `https://api.polygon.io/v1/open-close/${ticker}/${formattedDate}?adjusted=true&apiKey=${polygonKey}`
    ); //high, low, 52 week data, etc.

    const newsResponse = await axios.get(
      `https://api.polygon.io/v2/reference/news?ticker=${ticker}&apiKey=${polygonKey}`
    ); //most recent news on ticker

    const response = {
      detailsResponse: detailsResponse.data,
      priceDetails: priceDetailsResponse.data,
      news: newsResponse.data,
    };

    res.send(response);
  } catch {
    console.log("this is ticker", ticker);

    console.error("Error getting stock details, on endpoint: getTickerDetails");
  }
});

module.exports = router;
