import {formatInTimeZone} from 'date-fns-tz';

const isMarketOpen = () => {
    console.log("time within hours")
  // Define the Eastern Time time zone
  const timeZone = 'America/New_York';

  // Get the current date and time in Eastern Time
  const easternTime = formatInTimeZone(
    new Date(),
    timeZone,
    'yyyy-MM-dd HH:mm:ssXXX',
  );

  // Parse the time from the formatted string
  const [datePart, timePart] = easternTime.split(' ');
  const [hours, minutes, seconds] = timePart.split(':').map(Number);

  // Market is typically open from 9:30 AM to 4:00 PM ET
  return hours >= 4 && hours < 20;

  // TODO: implement weekends/holidays
  // maybe see if there's a quick server endpoint for this
};

export default isMarketOpen;
