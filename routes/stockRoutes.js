const express = require("express");
const router = express.Router();
const axios = require("axios");

// These routes may be obselete now since we aren't storing in database

const polygonKey = "_4BtZn3PRCLu6fsdu7dgddb4ucmB1sfp";
const getMostRecentMarketOpenDay = require("../utility/getMostRecentMarketOpenDay");


router.post("/getTickerDetails", async function (req, res) {
  const { ticker } = req.body;
  console.log("this is ticker",ticker)
  try {
    const detailsResponse = await axios.get(
      `https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${polygonKey}`
    ); //summary, market cap, etc.
    
    const now = Date.now();
    const mostRecentMarketDay = getMostRecentMarketOpenDay(now);

    const year = mostRecentMarketDay.getFullYear();
    const month = String(mostRecentMarketDay.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(mostRecentMarketDay.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;

    console.log("Most recent market day is this: " + formattedDate)    

    const priceDetailsResponse = await axios.get(
      `https://api.polygon.io/v1/open-close/${ticker}/${formattedDate}?adjusted=true&apiKey=${polygonKey}`
    ); //high, low, 52 week data, etc.
    console.log("pass1")
    const newsResponse = await axios.get(
      `https://api.polygon.io/v2/reference/news?ticker=${ticker}&apiKey=${polygonKey}`
    ); //most recent news on ticker
    console.log("pass2")
    const response = {
      detailsResponse: detailsResponse.data,
      priceDetails: priceDetailsResponse.data, 
      news: newsResponse.data
    };
    
    res.send(response);

  } catch {
    console.log("this is ticker",ticker)

    console.error("Error getting stock details, on endpoint: getTickerDetails");
  }
});

// // DIRECTIONS: Choose ticker and database, then run "node oneday.js" in the terminal.

// const fetchDetails = async (ticker) => {
//   const response = await axios.get(
//     `https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${polygonKey}`
//   );
//   return response.data.results;
// };

// /**
//  * This gets the open, close, high, and low, worth of prices from one date
//  * !! ADD a date to this
//  * @param ticker
//  * @param date most recent date to get high
//  */ 
// const fetchPriceDetails = async (ticker, date) => {
//   const response = await axios.get(
//     `https://api.polygon.io/v1/open-close/${ticker}/2024-03-21?adjusted=true&apiKey=${polygonKey}`
//   );
//   return response.data;
// };

// /**
//  * Grabs most recent news for given ticker
//  * @param ticker
//  */
// const fetchNews = async (ticker) => {
//   const response = await axios.get(
//     `https://api.polygon.io/v2/reference/news?ticker=${ticker}&apiKey=${polygonKey}`
//   );
//   return response.data;
// };

module.exports = router;
