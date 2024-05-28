const isMarketOpenToday = require('../utility/isMarketOpenToday');
const getPreviousDay = require('../utility/getPreviousDay');

function getMostRecentMarketOpenDay(now) {
    console.log("this is what is being fed in", now)
    let previousDate = getPreviousDay(now);
    console.log("this is what is being fed in for prevDate", previousDate)
    while (!isMarketOpenToday(previousDate)) {
      previousDate = getPreviousDay(previousDate);
    }
    console.log("this is what it thinks is previous market open date", previousDate)
    return previousDate;
}

module.exports = getMostRecentMarketOpenDay;