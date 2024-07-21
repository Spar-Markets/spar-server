const express = require("express");
const router = express.Router();
const axios = require("axios");
const { sparDB } = require("../config/mongoConnection");

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

    // const year = mostRecentMarketDay.getFullYear();

    // const month = String(mostRecentMarketDay.getMonth() + 1).padStart(2, "0"); // Months are zero-based

    // const day = String(mostRecentMarketDay.getDate()).padStart(2, "0");

    const formattedDate = "2024-06-18"; //`${year}-${month}-${day}`;

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
  } catch (error) {
    console.log("this is ticker", ticker);

    console.error(
      "Error getting stock details, on endpoint: getTickerDetails:",
      error
    );
  }
});

router.get("/getTickerList", async (req, res) => {
  // return JSON of tickers
  // hardcode for now
  // next step: request tickers from polygon. get ticker and company name. parse out other unnecessary data

  // NEW METHOD: from polygon. bypass 1000 limit using pagination

  // OLD METHOD: using imported data in MongoDB
  const tickerCollection = sparDB.db.collection("stockTicker");
  const allTickerData = await tickerCollection.findOne();

  const allTickers = [];

  if (allTickerData) {
    // loop over everything
    Object.keys(allTickerData).forEach((key) => {
      const rawticker = allTickerData[key];
      const stockObject = {
        ticker: rawticker.ticker,
        companyName: rawticker.title,
      };
      allTickers.push(stockObject);
    });
  }

  res.send(allTickers);
});

router.get("/getTodaysPrices/:ticker", async (req, res) => {
  const ticker = req.params.ticker;
  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
  try {
    const response = await axios.get(
      `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/minute/${today}/${today}?apiKey=${polygonKey}`
    );

    if (response.data.results) {
      res.json(response.data.results);
    } else {
      res
        .status(404)
        .json({ message: "No data found for the specified ticker and date." });
    }
  } catch (error) {
    console.error("Error fetching data from Polygon.io:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/getGainers", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/gainers?apiKey=${polygonKey}`
    );

    if (response.data) {
      res.status(200).send(response.data); // Send only the data part of the response
    } else {
      res.status(404).send({ message: "No data found" });
    }
  } catch (error) {
    console.error("Error fetching gainers:", error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

router.post("/getNews", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.polygon.io/v2/reference/news?limit=20&apiKey=${polygonKey}`
    );

    if (response.data) {
      res.status(200).send(response.data);
    }
  } catch (error) {
    res.status(500).send({ message: "Error getting News", error });
  }
});

router.post("/getStockCardData", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.polygon.io/v3/reference/tickers/AAPL?apiKey=${polygonKey}`
    );

    if (response.data) {
      res.status(200).send(response.data.results);
    }
  } catch (error) {
    res.status(500).send({ message: "Error getting News", error });
  }
});

module.exports = router;
