const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const getWeekDay = () => {
    const today = new Date();
    
    // Convert to UTC+7 by shifting the time
    const utc7 = new Date(today.getTime() + 7 * 60 * 60 * 1000);
    let weekDay = utc7.getUTCDay();
    return weekDay;
}

export const getFormatedTodayDate = () => {
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

export function getWeekRangeUTC(offset) {
  // offset in minutes for UTC+7
  const utc7Offset = offset * 60;
  const date = new Date();

  // convert the date to UTC+7 equivalent by adding the offset difference with local time zone
  const localOffset = date.getTimezoneOffset(); // in minutes
  const diff = localOffset + utc7Offset; // difference to add
  const utc7Date = new Date(date.getTime() + diff * 60 * 1000);

  // get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  // adjust so Monday = 0 for our week start
  let day = utc7Date.getDay();
  day = day === 0 ? 6 : day - 1;

  // calculate start of week (Monday 00:00:00)
  const startWeek = new Date(utc7Date);
  startWeek.setHours(0, 0, 0, 0);
  startWeek.setDate(utc7Date.getDate() - day);

  // calculate end of week (Sunday 23:59:59)
  const endWeek = new Date(startWeek);
  endWeek.setDate(startWeek.getDate() + 6);
  endWeek.setHours(23, 59, 59, 999);

  // Convert back to UTC by subtracting UTC+7 offset to get Date objects in actual time
  startWeek.setTime(startWeek.getTime() - utc7Offset * 60 * 1000);
  endWeek.setTime(endWeek.getTime() - utc7Offset * 60 * 1000);

  return { start: startWeek, end: endWeek };
}

export function getFormattedWeekRangeUTC7() {
  const today = new Date();

  // Convert to UTC+7 by shifting the time
  const utc7 = new Date(today.getTime() + 7 * 60 * 60 * 1000);

  // Get day of week using getUTCDay for utc7 date
  let weekDay = utc7.getUTCDay();

  // Calculate start of week (Monday) in UTC+7
  // Adjust so Monday=0 for calculation
  let dayIndex = weekDay === 0 ? 6 : weekDay - 1;
  const start = new Date(utc7);
  start.setUTCDate(utc7.getUTCDate() - dayIndex);
  start.setUTCHours(0, 0, 0, 0);

  // Calculate end of week (Sunday) in UTC+7
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);

  // Format day and month strings with leading zeros
  const formatDM = (date) => {
    let day = date.getUTCDate();
    let month = date.getUTCMonth() + 1;
    day = day < 10 ? '0' + day : day;
    month = month < 10 ? '0' + month : month;
    return { day, month };
  };

  const startDM = formatDM(start);
  const endDM = formatDM(end);

  return `${startDM.day}/${startDM.month} - ${endDM.day}/${endDM.month}`;
};


