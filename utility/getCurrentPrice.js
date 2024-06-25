// TODO: implement it
const axios = require("axios"); // Corrected this line, do not destructure axios
const { polygonKey } = require("../config/constants");

async function getCurrentPrice(ticker) {
  const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}?apiKey=${polygonKey}`;
  const response = await axios.get(url);
  console.log(`BUYING ${ticker} @ PRICE: $` + response.data.ticker.day.c);
  const currPrice = response.data.ticker.day.c;

  return currPrice;
}

module.exports = getCurrentPrice;
