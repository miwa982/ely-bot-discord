const DAY_MAP = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Parses a time string like "15:00", "2PM", "9:30PM", "03:00" into { hour, minute }
 */
export function parseTimeString(timeStr) {
  if (!timeStr) return null;
  const str = timeStr.trim().toLowerCase();

  // Check 12-hour format: e.g. "2pm", "9:30pm", "3am"
  const match12 = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const minute = match12[2] ? parseInt(match12[2], 10) : 0;
    const isPm = match12[3] === "pm";

    if (hour === 12) {
      hour = isPm ? 12 : 0;
    } else if (isPm) {
      hour += 12;
    }
    return { hour, minute };
  }

  // Check 24-hour format: e.g. "15:00", "9:30", "03:00"
  const match24 = str.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hour = parseInt(match24[1], 10);
    const minute = parseInt(match24[2], 10);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
  }

  // Just a single number: e.g. "15" -> 15:00
  const matchNum = str.match(/^(\d{1,2})$/);
  if (matchNum) {
    const hour = parseInt(matchNum[1], 10);
    if (hour >= 0 && hour <= 23) {
      return { hour, minute: 0 };
    }
  }

  return null;
}

/**
 * Parses dynamic reminder string like "1d, 2h, 1h, 30m" into an array of { label, ms }
 */
export function parseReminderString(reminderStr) {
  if (!reminderStr) return [];
  const parts = reminderStr.split(/[,\s]+/).filter(Boolean);
  const results = [];

  for (const part of parts) {
    const match = part.trim().toLowerCase().match(/^(\d+)\s*([smhdw]|days?|hours?|mins?|minutes?|weeks?)?$/);
    if (!match) continue;

    const num = parseInt(match[1], 10);
    const unit = (match[2] || "m").toLowerCase();

    let ms = 0;
    let label = `${num}m`;

    if (unit.startsWith("s")) {
      ms = num * 1000;
      label = `${num} sec`;
    } else if (unit.startsWith("m")) {
      ms = num * 60 * 1000;
      label = num === 1 ? "1 min" : `${num} mins`;
    } else if (unit.startsWith("h")) {
      ms = num * 60 * 60 * 1000;
      label = num === 1 ? "1 hour" : `${num} hours`;
    } else if (unit.startsWith("d")) {
      ms = num * 24 * 60 * 60 * 1000;
      label = num === 1 ? "1 day" : `${num} days`;
    } else if (unit.startsWith("w")) {
      ms = num * 7 * 24 * 60 * 60 * 1000;
      label = num === 1 ? "1 week" : `${num} weeks`;
    }

    if (ms > 0 && !results.some((r) => r.ms === ms)) {
      results.push({ label, ms });
    }
  }

  // Sort descending (largest reminder first: e.g. 1d -> 2h -> 1h -> 30m)
  return results.sort((a, b) => b.ms - a.ms);
}

/**
 * Calculates current or next weekly cycle start and end Dates in UTC+7 (Asia/Bangkok)
 */
export function calculateWeeklyDates(weeklyPattern, now = new Date(), tzOffsetHours = 7) {
  const { startDay, startHour, startMinute, endDay, endHour, endMinute } = weeklyPattern;

  // Convert current time to UTC+7 representation
  const utc7Ms = now.getTime() + tzOffsetHours * 60 * 60 * 1000;
  const currentUtc7 = new Date(utc7Ms);

  const curDay = currentUtc7.getUTCDay();
  const curHour = currentUtc7.getUTCHours();
  const curMin = currentUtc7.getUTCMinutes();
  const curSec = currentUtc7.getUTCSeconds();

  // Helper to create UTC Date object representing a given UTC+7 weekday, hour, minute
  function getUtcDateForOffset(dayOffset, hour, minute) {
    const year = currentUtc7.getUTCFullYear();
    const month = currentUtc7.getUTCMonth();
    const date = currentUtc7.getUTCDate() + dayOffset;
    return new Date(Date.UTC(year, month, date, hour - tzOffsetHours, minute, 0, 0));
  }

  // Calculate day difference from today to startDay
  let diffStart = startDay - curDay;
  let diffEnd = endDay - curDay;

  // If endDay is before startDay in week (e.g. Fri to Sun diff is 2, but Fri to Wed is +5), adjust
  let cycleDurationDays = endDay - startDay;
  if (cycleDurationDays < 0 || (cycleDurationDays === 0 && (endHour < startHour || (endHour === startHour && endMinute <= startMinute)))) {
    cycleDurationDays += 7;
  }

  // Check candidate start date for this week
  let candidateStart = getUtcDateForOffset(diffStart, startHour, startMinute);
  let candidateEnd = getUtcDateForOffset(diffStart + cycleDurationDays, endHour, endMinute);

  // If the cycle already ended in the past, move to next week (+7 days)
  while (candidateEnd.getTime() <= now.getTime()) {
    candidateStart = new Date(candidateStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    candidateEnd = new Date(candidateEnd.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  return {
    startDate: candidateStart,
    endDate: candidateEnd,
  };
}

/**
 * Parses user schedule string:
 * Examples:
 * - "Mon 15:00 - Wed 22:00" or "Fri 2PM - Sun 9PM"
 * - "Every 14d from 2026-09-01 10:00"
 * - "2026-09-01 10:00 - 2026-09-15 18:00"
 */
export function parseScheduleInput(scheduleStr, tzOffsetHours = 7) {
  if (!scheduleStr) return null;
  const str = scheduleStr.trim();

  // 1. Weekly pattern: e.g. "Mon 15:00 - Wed 22:00" or "Friday 2PM to Sunday 9PM"
  const weeklyMatch = str.match(
    /^([A-Za-z]+)\s+([0-9:ampAMP\s]+)\s*(?:-|to|–)\s*([A-Za-z]+)\s+([0-9:ampAMP\s]+)$/i,
  );

  if (weeklyMatch) {
    const startDayKey = weeklyMatch[1].toLowerCase().slice(0, 3);
    const endDayKey = weeklyMatch[3].toLowerCase().slice(0, 3);

    if (DAY_MAP[startDayKey] !== undefined && DAY_MAP[endDayKey] !== undefined) {
      const startTime = parseTimeString(weeklyMatch[2]);
      const endTime = parseTimeString(weeklyMatch[4]);

      if (startTime && endTime) {
        const weeklyPattern = {
          startDay: DAY_MAP[startDayKey],
          startHour: startTime.hour,
          startMinute: startTime.minute,
          endDay: DAY_MAP[endDayKey],
          endHour: endTime.hour,
          endMinute: endTime.minute,
        };

        const { startDate, endDate } = calculateWeeklyDates(weeklyPattern, new Date(), tzOffsetHours);

        return {
          scheduleKind: "weekly",
          weeklyPattern,
          startDate,
          endDate,
          descriptionText: `Weekly: Every ${DAY_NAMES[weeklyPattern.startDay]} ${String(weeklyPattern.startHour).padStart(2, "0")}:${String(weeklyPattern.startMinute).padStart(2, "0")} → ${DAY_NAMES[weeklyPattern.endDay]} ${String(weeklyPattern.endHour).padStart(2, "0")}:${String(weeklyPattern.endMinute).padStart(2, "0")}`,
        };
      }
    }
  }

  // 2. Interval pattern: e.g. "Every 14d from 2026-09-01 10:00" or "Every 3d"
  const intervalMatch = str.match(/^every\s+(\d+)\s*(d|days?|h|hours?)(?:\s+from\s+([0-9\-:\s]+))?/i);
  if (intervalMatch) {
    const num = parseInt(intervalMatch[1], 10);
    const isDays = intervalMatch[2].toLowerCase().startsWith("d");
    const intervalDays = isDays ? num : num / 24;

    let startDate = new Date();
    if (intervalMatch[3]) {
      const parsedStart = new Date(intervalMatch[3].trim().replace(" ", "T") + ":00+07:00");
      if (!isNaN(parsedStart.getTime())) {
        startDate = parsedStart;
      }
    }

    const durationMs = (isDays ? num : num / 24) * 24 * 60 * 60 * 1000;
    const endDate = new Date(startDate.getTime() + durationMs);

    return {
      scheduleKind: "interval",
      intervalDays,
      startDate,
      endDate,
      descriptionText: `Interval: Repeats every ${num} ${isDays ? "day(s)" : "hour(s)"}`,
    };
  }

  // 3. Absolute Date range: "2026-09-01 10:00 - 2026-09-15 18:00" or "2026-09-01 10:00 to 2026-09-15 18:00"
  const dateRangeMatch = str.match(/^([0-9\-:\s]+)\s*(?:-|to|–)\s*([0-9\-:\s]+)$/);
  if (dateRangeMatch) {
    const startPart = dateRangeMatch[1].trim().replace(" ", "T") + ":00+07:00";
    const endPart = dateRangeMatch[2].trim().replace(" ", "T") + ":00+07:00";

    const startDate = new Date(startPart);
    const endDate = new Date(endPart);

    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      return {
        scheduleKind: "linear",
        startDate,
        endDate,
        descriptionText: `One-time: From <t:${Math.floor(startDate.getTime() / 1000)}:f> to <t:${Math.floor(endDate.getTime() / 1000)}:f>`,
      };
    }
  }

  // 4. Single Start Date: e.g. "2026-09-01 10:00"
  const singleDate = new Date(str.replace(" ", "T") + ":00+07:00");
  if (!isNaN(singleDate.getTime())) {
    return {
      scheduleKind: "linear",
      startDate: singleDate,
      endDate: null,
      descriptionText: `One-time: <t:${Math.floor(singleDate.getTime() / 1000)}:f>`,
    };
  }

  return null;
}
