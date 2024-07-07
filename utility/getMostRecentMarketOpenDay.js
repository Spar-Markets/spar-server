const isMarketOpenToday = require("../utility/isMarketOpenToday");
const getPreviousDay = require("../utility/getPreviousDay");

function getMostRecentMarketOpenDay(now) {
  console.log("STEP 2: Hit get most recent market day function");
  i = 0;
  while (!isMarketOpenToday(now)) {
    console.log("STEP 3: Going backwards in days. Counter:", i);
    now = getPreviousDay(now);
    i += 1;
  }
  console.log(
    "STEP 4: About to return the most recent market day, which is",
    now
  );
  return now;
}

module.exports = getMostRecentMarketOpenDay;
