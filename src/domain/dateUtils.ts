const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function parseMonth(month: string): { year: number; monthIndex: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) {
    throw new Error(`Invalid month: ${month}`);
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) {
    throw new Error(`Invalid month: ${month}`);
  }

  return { year, monthIndex };
}

export function formatDateUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function datesInMonth(month: string): Date[] {
  const { year, monthIndex } = parseMonth(month);
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return Array.from({ length: daysInMonth }, (_, index) => new Date(Date.UTC(year, monthIndex, index + 1)));
}

export function startOfMondayWeek(date: Date): Date {
  const weekday = date.getUTCDay();
  const daysSinceMonday = (weekday + 6) % 7;
  return new Date(date.getTime() - daysSinceMonday * MS_PER_DAY);
}

export function differenceInWholeDays(later: Date, earlier: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / MS_PER_DAY);
}

export function weekOffset(date: Date, anchor: Date): number {
  return Math.floor(differenceInWholeDays(startOfMondayWeek(date), startOfMondayWeek(anchor)) / 7);
}
