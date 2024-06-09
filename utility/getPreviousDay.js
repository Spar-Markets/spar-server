// Function to get the previous day
function getPreviousDay(date) {
  //This is to convert the GMT into EDT and it is a 4 hour in milliseconds
  date = date - 14400000;

  const previousDay = new Date(date);
  // Subtracts one from todays date to get yesterdays date...
  previousDay.setDate(previousDay.getDate() - 1);
  return previousDay;
}

module.exports = getPreviousDay;
