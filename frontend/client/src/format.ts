/** Matches the schools table seeded in backend/server/src/schema.sql */
export const SCHOOL_OPTIONS = [
  { id: 1, short: 'UBC', name: 'University of British Columbia', domain: 'student.ubc.ca', color: 'mint' },
  { id: 2, short: 'SFU', name: 'Simon Fraser University', domain: 'sfu.ca', color: 'pink' },
  { id: 3, short: 'UVic', name: 'University of Victoria', domain: 'uvic.ca', color: 'yellow' },
] as const;

export const SCHOOLS: Record<number, string> = {
  1: 'UBC Vancouver Campus',
  2: 'SFU Burnaby Campus',
  3: 'UVic Campus',
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "3:30PM", "5PM" */
const clock = (d: Date) => {
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes();
  return `${h}${m ? `:${String(m).padStart(2, '0')}` : ''}${d.getHours() < 12 ? 'AM' : 'PM'}`;
};

/** "Today, 3:30 - 5PM" / "Tomorrow, 2 - 3PM" / "November 12, 6 - 8PM" */
export function formatWhen(startIso: string, endIso: string, now = new Date()): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const day = sameDay(start, now)
    ? 'Today'
    : sameDay(start, tomorrow)
      ? 'Tomorrow'
      : start.toLocaleDateString('en-CA', { month: 'long', day: 'numeric' });
  const startClock = clock(start);
  const endClock = clock(end);
  // Drop the first AM/PM when both times share it: "3:30 - 5PM".
  const sameHalf = start.getHours() < 12 === end.getHours() < 12;
  return `${day}, ${sameHalf ? startClock.slice(0, -2) : startClock} - ${endClock}`;
}

/** "November 07 2026" */
export const formatHeaderDate = (d = new Date()) =>
  `${d.toLocaleDateString('en-CA', { month: 'long' })} ${String(d.getDate()).padStart(2, '0')} ${d.getFullYear()}`;
