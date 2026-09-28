// Activation code expiry <-> <input type="date"> value, in the admin's own time zone:
// a code set to expire on a date stays valid until the end of that day, and the table
// shows that same date.

const pad = (n: number) => String(n).padStart(2, '0');

/** YYYY-MM-DD of an ISO date, in local time */
export function toDateInputValue(iso: string | Date): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** End of the day YYYY-MM-DD in local time, as an ISO string */
export function endOfDayIso(dateInputValue: string): string {
  const [year, month, day] = dateInputValue.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

/** Whether a code expiring on that day is still valid now */
export function isDayNotPast(dateInputValue: string): boolean {
  return new Date(endOfDayIso(dateInputValue)).getTime() > Date.now();
}
