const isMarketOpenToday = require("../utility/isMarketOpenToday");
const getPreviousDay = require("../utility/getPreviousDay");

function getMostRecentMarketOpenDay(now) {
  i = 0;
  while (!isMarketOpenToday(now)) {
    i += 1;
    console.log("GetMostRecentMarketDay: Skip #" + 1, "this is not a market day:", now)
    now = getPreviousDay(now);
  }
  return now;
}

module.exports = getMostRecentMarketOpenDay;
