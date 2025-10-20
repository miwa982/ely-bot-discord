const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const getWeekDay = () => {
    const today = new Date();
    
    // Convert to UTC+7 by shifting the time
    const utc7 = new Date(today.getTime() + 7 * 60 * 60 * 1000);
    let weekDay = utc7.getUTCDay();
    return weekDay;
}
export const getFormatedDate = () => {
    const today = new Date();
    
    // Convert to UTC+7 by shifting the time
    const utc7 = new Date(today.getTime() + 7 * 60 * 60 * 1000);
    
    let day = utc7.getUTCDate();
    let month = utc7.getUTCMonth() + 1; // getMonth() returns 0-indexed month
    let year = utc7.getUTCFullYear();
    let weekDay = utc7.getUTCDay();

    // Add leading zeros if day or month is a single digit
    day = day < 10 ? '0' + day : day;
    month = month < 10 ? '0' + month : month;
    
    return `${dayNames[weekDay]} - ${day}/${month}`;
    
}

export function getTodayRangeUTC(offset) {
  const now = new Date();

  // convert current time to UTC+7
  const utc7Offset = offset * 60; // minutes
  const localOffset = now.getTimezoneOffset(); // in minutes, relative to UTC
  const diff = utc7Offset + localOffset;

  const utc7Now = new Date(now.getTime() + diff * 60 * 1000);

  // start of day in UTC+7
  const startOfDay = new Date(utc7Now);
  startOfDay.setHours(0, 0, 0, 0);

  // end of day in UTC+7
  const endOfDay = new Date(utc7Now);
  endOfDay.setHours(23, 59, 59, 999);

  // convert back to server local time (for MongoDB queries)
  return {
    start: new Date(startOfDay.getTime() - diff * 60 * 1000),
    end: new Date(endOfDay.getTime() - diff * 60 * 1000)
  };
}
