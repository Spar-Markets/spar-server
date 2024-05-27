function isMarketOpenToday(inputDate) {
  const date = new Date(inputDate);
  const holidays = [
    // New Year's Day (January 1)
    new Date(date.getFullYear(), 0, 1).getTime(),
    // Martin Luther King Jr. Day (Third Monday in January)
    new Date(
      date.getFullYear(),
      0,
      15 - ((new Date(date.getFullYear(), 0, 1).getDay() + 1) % 7) + 15
    ).getTime(),
    // Presidents' Day (Third Monday in February)
    new Date(
      date.getFullYear(),
      1,
      15 - ((new Date(date.getFullYear(), 1, 1).getDay() + 1) % 7) + 15
    ).getTime(),
    // Good Friday (date varies, usually in April)
    // Memorial Day (Last Monday in May)
    new Date(
      date.getFullYear(),
      4,
      31 - new Date(date.getFullYear(), 4, 31).getDay()
    ).getTime(),
    // Independence Day (July 4)
    new Date(date.getFullYear(), 6, 4).getTime(),
    // Labor Day (First Monday in September)
    new Date(
      date.getFullYear(),
      8,
      1 + ((7 - new Date(date.getFullYear(), 8, 1).getDay()) % 7)
    ).getTime(),
    // Thanksgiving Day (Fourth Thursday in November)
    new Date(
      date.getFullYear(),
      10,
      22 + ((11 - new Date(date.getFullYear(), 10, 1).getDay()) % 7)
    ).getTime(),
    // Christmas Day (December 25)
    new Date(date.getFullYear(), 11, 25).getTime(),
  ];

  const dayOfWeek = date.getDay();
  const currentDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();

  // Check if today is Saturday (6) or Sunday (0)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  // Check if today is a holiday
  if (holidays.includes(currentDate)) {
    return false;
  }

  // Additional holiday rules
  // If Independence Day falls on a Saturday, market closed on Friday (observed)
  if (
    date.getMonth() === 6 &&
    (date.getDate() === 3 || date.getDate() === 5) &&
    dayOfWeek === 5
  ) {
    return false;
  }
  // If Independence Day falls on a Sunday, market closed on Monday (observed)
  if (date.getMonth() === 6 && date.getDate() === 4 && dayOfWeek === 1) {
    return false;
  }
  // If Christmas falls on a Saturday, market closed on Friday (observed)
  if (
    date.getMonth() === 11 &&
    (date.getDate() === 24 || date.getDate() === 26) &&
    dayOfWeek === 5
  ) {
    return false;
  }
  // If Christmas falls on a Sunday, market closed on Monday (observed)
  if (date.getMonth() === 11 && date.getDate() === 25 && dayOfWeek === 1) {
    return false;
  }

  return true;

}

module.exports = isMarketOpenToday;


