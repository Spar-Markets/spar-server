// TODO: implement it
async function getCurrentPrice(ticker) {
  const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/${ticker}?apiKey=${polygonKey}`;
  const response = await axios.get(url);
  const currPrice = reponse.data.ticker.min.c;

  return currPrice;
}

module.exports = getCurrentPrice;
