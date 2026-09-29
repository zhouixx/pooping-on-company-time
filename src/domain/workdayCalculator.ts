import { datesInMonth, formatDateUTC, weekOffset } from './dateUtils';
import type {
  CalendarDay,
  CalendarOverlay,
  DateOverrides,
  DayStatus,
  PatternSettings,
  WeekType,
} from './types';

function statusForWeekday(weekday: number, weekType: WeekType): DayStatus {
  const isRest = weekType === 'single' ? weekday === 0 : weekday === 0 || weekday === 6;
  return isRest ? 'rest' : 'work';
}

function baseStatusForDate(date: Date, firstDate: Date, settings: PatternSettings): DayStatus {
  const weekday = date.getUTCDay();
  if (settings.pattern === 'single') {
    return statusForWeekday(weekday, 'single');
  }
  if (settings.pattern === 'double') {
    return statusForWeekday(weekday, 'double');
  }

  const offset = weekOffset(date, firstDate);
  const firstWeekType = settings.alternateWeekType;
  const isSameAsFirst = offset % 2 === 0;
  const weekType = isSameAsFirst
    ? firstWeekType
    : firstWeekType === 'single'
      ? 'double'
      : 'single';
  return statusForWeekday(weekday, weekType);
}

export function buildCalendarDays(
  month: string,
  settings: PatternSettings,
  overlays: CalendarOverlay[],
  overrides: DateOverrides,
): CalendarDay[] {
  const dates = datesInMonth(month);
  const firstDate = dates[0];
  if (!firstDate) {
    return [];
  }

  const overlayByDate = new Map(overlays.map((overlay) => [overlay.date, overlay]));

  return dates.map((date) => {
    const dateString = formatDateUTC(date);
    const baseStatus = baseStatusForDate(date, firstDate, settings);
    const overlay = overlayByDate.get(dateString);
    const override = overrides[dateString];

    if (override) {
      return {
        date: dateString,
        weekday: date.getUTCDay(),
        isWeekend: date.getUTCDay() === 0 || date.getUTCDay() === 6,
        status: override,
        label: '手动调整',
        source: 'user',
      };
    }

    if (overlay) {
      return {
        date: dateString,
        weekday: date.getUTCDay(),
        isWeekend: date.getUTCDay() === 0 || date.getUTCDay() === 6,
        status: overlay.status,
        label: overlay.label,
        source: overlay.source,
      };
    }

    return {
      date: dateString,
      weekday: date.getUTCDay(),
      isWeekend: date.getUTCDay() === 0 || date.getUTCDay() === 6,
      status: baseStatus,
      source: 'pattern',
    };
  });
}

export function countWorkdays(days: CalendarDay[]): number {
  return days.filter((day) => day.status === 'work' || day.status === 'makeup').length;
}
