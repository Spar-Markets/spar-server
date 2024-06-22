// Function to get the previous day
function getPreviousDay(date) {
  const previousDay = new Date(date);
  // Subtracts one from todays date to get yesterdays date...
  previousDay.setDate(previousDay.getDate() - 1);
  return previousDay;
}

module.exports = getPreviousDay;
