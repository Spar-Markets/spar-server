const isMarketOpenToday = require("../utility/isMarketOpenToday");
const getPreviousDay = require("../utility/getPreviousDay");

function getMostRecentMarketOpenDay(now) {
  i = 0;
  while (!isMarketOpenToday(now)) {
    console.log("STEP 1.5: Going backwards in days. Counter:", i);
    now = getPreviousDay(now);
    i += 1;
  }
  console.log(
    "STEP 1.6: About to return the most recent market day, which is",
    now
  );
  return now;
}

module.exports = getMostRecentMarketOpenDay;
