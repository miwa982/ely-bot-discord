const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const getWeekDay = () => {
    const today = new Date();
    
    // Convert to UTC+7 by shifting the time
    const utc7 = new Date(today.getTime() + 7 * 60 * 60 * 1000);
    let weekDay = utc7.getUTCDay();
    return weekDay;
}
/**
 * Returns a formatted date string for a given day offset
 * @param {number} dayOffset - 0 = today, 1 = tomorrow, -1 = yesterday
 * @returns {string} formatted date like "Wednesday - 13/11"
 */
export const getFormatedTodayDate = (dayOffset = 0) => {
    const offset = 7; // UTC+7
    const now = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000); // apply day offset

    // Convert to UTC+7
    const utc7 = new Date(now.getTime() + offset * 60 * 60 * 1000);

    let day = utc7.getUTCDate();
    let month = utc7.getUTCMonth() + 1;
    const weekDay = utc7.getUTCDay();

    // Leading zeros
    day = day < 10 ? '0' + day : day;
    month = month < 10 ? '0' + month : month;

    return `${dayNames[weekDay]} - ${day}/${month}`;
};

/**
 * Returns start and end Date for a day in UTC+7
 * @param {number} offset - UTC offset in hours (e.g., 7)
 * @param {number} dayOffset - 0 = today, 1 = tomorrow, -1 = yesterday
 * @returns {{ start: Date, end: Date }}
 */
export function getTodayRangeUTC(offset = 7, dayOffset = 0) {
    const now = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000);

    // Convert to UTC+7
    const utcOffsetMinutes = offset * 60;
    const localOffset = now.getTimezoneOffset();
    const diff = utcOffsetMinutes + localOffset;

    const utc7Now = new Date(now.getTime() + diff * 60 * 1000);

    // Start of day UTC+7
    const startOfDay = new Date(utc7Now);
    startOfDay.setHours(0, 0, 0, 0);

    // End of day UTC+7
    const endOfDay = new Date(utc7Now);
    endOfDay.setHours(23, 59, 59, 999);

    // Convert back to UTC for DB queries
    return {
        start: new Date(startOfDay.getTime() - diff * 60 * 1000),
        end: new Date(endOfDay.getTime() - diff * 60 * 1000),
    };
}


/**
 * Get start and end of a week (in UTC) for a given timezone offset.
 * 
 * @param {number} offset - UTC offset (e.g. 7 for UTC+7)
 * @param {number} weekOffset - Number of weeks to move:
 *                              -1 = previous week, 0 = current week, 1 = next week
 * @returns {{ start: Date, end: Date }} start and end times in UTC
 */
export function getWeekRangeUTC(offset = 7, weekOffset = 0) {
  // offset in minutes for UTC+7
  const utcOffsetMinutes = offset * 60;
  const now = new Date();

  // convert the date to UTC+7 equivalent by adding the offset difference with local time zone
  const localOffset = now.getTimezoneOffset(); // in minutes
  const diff = localOffset + utcOffsetMinutes; // difference to add
  const utc7Date = new Date(now.getTime() + diff * 60 * 1000);

  // get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  // adjust so Monday = 0 for our week start
  let day = utc7Date.getDay();
  day = day === 0 ? 6 : day - 1;

  // calculate start of current week (Monday 00:00:00 UTC+7)
  const startWeek = new Date(utc7Date);
  startWeek.setHours(0, 0, 0, 0);
  startWeek.setDate(utc7Date.getDate() - day + weekOffset * 7);

  // calculate end of week (Sunday 23:59:59 UTC+7)
  const endWeek = new Date(startWeek);
  endWeek.setDate(startWeek.getDate() + 6);
  endWeek.setHours(23, 59, 59, 999);

  // Convert both back to UTC (remove the +7 offset)
  startWeek.setTime(startWeek.getTime() - utcOffsetMinutes * 60 * 1000);
  endWeek.setTime(endWeek.getTime() - utcOffsetMinutes * 60 * 1000);

  return { start: startWeek, end: endWeek };
}

/**
 * Returns a formatted week range string (DD/MM - DD/MM) in UTC+7
 * @param {number} weekOffset - Number of weeks to move: -1 = previous, 0 = current, 1 = next
 * @returns {string} formatted week range
 */
export function getFormattedWeekRangeUTC7(weekOffset = 0) {
  const offset = 7; // UTC+7
  const { start, end } = getWeekRangeUTC(offset, weekOffset);

  const formatDM = (date) => {
    const utc7Date = new Date(date.getTime() + offset * 60 * 60 * 1000);
    const day = String(utc7Date.getUTCDate()).padStart(2, '0');
    const month = String(utc7Date.getUTCMonth() + 1).padStart(2, '0');
    return { day, month };
  };

  const startDM = formatDM(start);
  const endDM = formatDM(end);

  return `${startDM.day}/${startDM.month} - ${endDM.day}/${endDM.month}`;
}



