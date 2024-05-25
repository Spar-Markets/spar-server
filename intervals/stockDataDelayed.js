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
  const timestamp1 = now - millisAgo;
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
      const result = await oneDayStock.findOneAndUpdate(
        { ticker: ticker },
        {
          $set: { currentPrice: newPrice },
          $setOnInsert: { prices: [] }, // to make sure prices array is initialized if new document is created
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );
      console.log(
        "Updated",
        result.ticker,
        ". New price: ",
        result.currentPrice
      );

      // update the cache
      priceCache[ticker] = newPrice;
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

  // Check if current time is within the specified range
  const afterStart =
    currentHour > startHour ||
    (currentHour === startHour && currentMinute >= startMinute);
  const beforeEnd =
    currentHour < endHour ||
    (currentHour === endHour && currentMinute <= endMinute);

  return afterStart && beforeEnd;
};

// Stock data
module.exports = function () {
  setInterval(async () => {
    if (isWithinMarketHours()) {
      updateCurrentPrice("AAPL");
      updateCurrentPrice("GOOG");
      updateCurrentPrice("TSLA");
    } else {
      console.log("Outside market hours. Skipping function.");
    }
  }, 20000);
};
