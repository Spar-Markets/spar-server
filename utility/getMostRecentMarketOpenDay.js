const isMarketOpenToday = require("../utility/isMarketOpenToday");
const getPreviousDay = require("../utility/getPreviousDay");

function getMostRecentMarketOpenDay(now) {
  i = 0;
  while (!isMarketOpenToday(now)) {
    i += 1;
    now = getPreviousDay(now);
  }
  return now;
}

module.exports = getMostRecentMarketOpenDay;
