// Helper functions for date manipulation
export const formatDate = (date) => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const addDays = (date, days) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

export const addMonths = (date, months) => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

export const addYears = (date, years) => {
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() + years);
  return newDate;
};

export const formatDateToDDMMYYYY = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date)) return "";
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const findNextWorkingDay = (targetDate, workingDays) => {
  const targetDateStr = formatDateToDDMMYYYY(targetDate);

  // If target date is a working day, return it
  if (workingDays.includes(targetDateStr)) {
    return targetDateStr;
  }

  // Find the next working day after target date
  const targetDateObj = new Date(
    targetDateStr.split("/").reverse().join("-")
  );
  const nextWorkingDay = workingDays.find((day) => {
    const dayObj = new Date(day.split("/").reverse().join("-"));
    return dayObj > targetDateObj;
  });

  return nextWorkingDay || targetDateStr;
};

export const findEndOfWeekDate = (date, weekNumber, workingDays) => {
  const [targetDay, targetMonth, targetYear] = formatDateToDDMMYYYY(date)
    .split("/")
    .map(Number);

  // Filter working days for the target month
  const monthDays = workingDays.filter((day) => {
    const [dayDay, dayMonth, dayYear] = day.split("/").map(Number);
    return dayYear === targetYear && dayMonth === targetMonth;
  });

  if (weekNumber === -1) {
    // Last week of month
    return monthDays[monthDays.length - 1];
  }

  // Group by weeks (assuming week_num from Supabase is correct or just dividing by 7)
  // Note: The original logic grouped by calculated week number
  const weeks = {};
  monthDays.forEach((day) => {
    const [dayDay, dayMonth, dayYear] = day.split("/").map(Number);
    // const dayObj = new Date(dayYear, dayMonth - 1, dayDay);
    const weekNum = Math.ceil(dayDay / 7);
    if (!weeks[weekNum]) weeks[weekNum] = [];
    weeks[weekNum].push(day);
  });

  // Get the last day of the requested week
  const weekDays = weeks[weekNumber];
  return weekDays ? weekDays[weekDays.length - 1] : monthDays[monthDays.length - 1];
};

export const formatDateTimeForStorage = (date, time) => {
  if (!date || !time) return "";
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}T${time}:00`;
};

// --- New Dashboard Specific Date Utils ---

export const parseTaskStartDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return null;

  // Handle YYYY-MM-DD format (ISO format from Supabase)
  if (dateStr.includes("-") && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    const parsed = new Date(dateStr);
    return isNaN(parsed) ? null : parsed;
  }

  // Handle DD/MM/YYYY format (with or without time)
  if (dateStr.includes("/")) {
    // Split by space first to separate date and time
    const parts = dateStr.split(" ");
    const datePart = parts[0]; // "25/08/2025"

    const dateComponents = datePart.split("/");
    if (dateComponents.length !== 3) return null;

    const [day, month, year] = dateComponents.map(Number);

    if (!day || !month || !year) return null;

    // Create date object (month is 0-indexed)
    const date = new Date(year, month - 1, day);

    // If there's time component, parse it
    if (parts.length > 1) {
      const timePart = parts[1]; // "09:00:00"
      const timeComponents = timePart.split(":");
      if (timeComponents.length >= 2) {
        const [hours, minutes, seconds] = timeComponents.map(Number);
        date.setHours(hours || 0, minutes || 0, seconds || 0);
      }
    }

    return isNaN(date) ? null : date;
  }

  // Fallback: Try ISO format
  const parsed = new Date(dateStr);
  return isNaN(parsed) ? null : parsed;
};

export const isDateToday = (date) => {
  if (!date || !(date instanceof Date)) return false;
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const isDateInPast = (date) => {
  if (!date || !(date instanceof Date)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
};

export const isDateFuture = (date) => {
  if (!date || !(date instanceof Date)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate > today;
};

export const isDateTomorrow = (dateStr) => {
  const date = parseTaskStartDate(dateStr);
  if (!date) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date.getTime() === tomorrow.getTime();
};

/**
 * Normalizes any date string to YYYY-MM-DD for Supabase queries
 */
export const ensureYYYYMMDD = (dateStr) => {
  if (!dateStr) return "";

  // If already YYYY-MM-DD
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dateStr.split('T')[0].split(' ')[0];
  }

  // If DD-MM-YYYY or DD/MM/YYYY
  const match = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (match) {
    const [_, d, m, y] = match;
    return `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
  }

  // Fallback to Date object parsing
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats YYYY-MM-DD to DD/MM/YYYY for UI display
 */
export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";
  const normalized = ensureYYYYMMDD(dateStr);
  if (!normalized) return "";
  const [y, m, d] = normalized.split('-');
  return `${d}/${m}/${y}`;
};
