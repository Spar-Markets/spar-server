const isMarketOpenToday = require("../utility/isMarketOpenToday");
const getPreviousDay = require("../utility/getPreviousDay");

function getMostRecentMarketOpenDay(now) {
  while (!isMarketOpenToday(now)) {
    now = getPreviousDay(now);
  }
  return now;
}

module.exports = getMostRecentMarketOpenDay;
