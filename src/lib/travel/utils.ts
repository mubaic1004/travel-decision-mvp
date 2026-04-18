const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  weekday: "short",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const currencyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0,
});

const preciseCurrencyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

export function toLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function toLocalDateTime(dateTimeString: string): Date {
  return new Date(dateTimeString);
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildDateTime(
  dateString: string,
  timeString: string,
  dayOffset = 0,
): string {
  const baseDate = addDays(toLocalDate(dateString), dayOffset);
  const [hours, minutes] = timeString.split(":").map(Number);
  baseDate.setHours(hours, minutes, 0, 0);
  return `${formatDateInput(baseDate)}T${String(hours).padStart(2, "0")}:${String(
    minutes,
  ).padStart(2, "0")}`;
}

export function listWeekdayDates(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  let cursor = new Date(startDate);

  while (cursor <= endDate) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(formatDateInput(cursor));
    }
    cursor = addDays(cursor, 1);
  }

  return dates;
}

export function diffDaysInclusive(startDate: Date, endDate: Date): number {
  const diffInMs = endDate.getTime() - startDate.getTime();
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24)) + 1;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function extractTime(dateTimeString: string): string {
  const date = toLocalDateTime(dateTimeString);
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

export function formatDisplayDate(dateString: string): string {
  return dateFormatter.format(toLocalDate(dateString));
}

export function formatDisplayDateTime(dateTimeString: string): string {
  return dateTimeFormatter.format(toLocalDateTime(dateTimeString));
}

export function formatCurrency(amount: number, fractionDigits = 0): string {
  return fractionDigits === 0
    ? currencyFormatter.format(amount)
    : preciseCurrencyFormatter.format(amount);
}

export function hashString(value: string): number {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  }

  return Math.abs(hash);
}

export function countWeekendNights(
  departDateString: string,
  hotelNights: number,
): number {
  let count = 0;

  for (let offset = 0; offset < hotelNights; offset += 1) {
    const nightDate = addDays(toLocalDate(departDateString), offset);
    const day = nightDate.getDay();
    if (day === 5 || day === 6) {
      count += 1;
    }
  }

  return count;
}
