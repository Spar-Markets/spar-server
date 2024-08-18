const { formatInTimeZone } = require('date-fns-tz');

const estTime = () => {
    // Define the Eastern Time time zone
    const timeZone = 'America/New_York';

    // Get the current date and time in Eastern Time
    const easternTime = formatInTimeZone(
        new Date(),
        timeZone,
        'yyyy-MM-dd HH:mm:ssXXX',
    );
    console.log(easternTime)

    return easternTime
};

module.exports = estTime;
