const isMarketOpenToday = require("../utility/isMarketOpenToday");
const getPreviousDay = require("../utility/getPreviousDay");

function getMostRecentMarketOpenDay(now) {
  let previousDate = now;
  while (!isMarketOpenToday(previousDate)) {
    previousDate = getPreviousDay(previousDate);
  }
  return previousDate;
}

module.exports = getMostRecentMarketOpenDay;
