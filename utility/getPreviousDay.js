
// Function to get the previous day
function getPreviousDay(date) {
    const previousDay = new Date(date);
    console.log("date!?",previousDay.getDate())
    previousDay.setDate(previousDay.getDate() - 1);
    console.log(previousDay)
    return previousDay;
}

module.exports = getPreviousDay;