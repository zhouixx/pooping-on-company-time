import { describe, expect, it } from 'vitest';
import { buildCalendarDays, countWorkdays } from '../workdayCalculator';

describe('workdayCalculator', () => {
  it('counts 22 actual workdays for September 2026 double-rest schedule', () => {
    const days = buildCalendarDays(
      '2026-09',
      { pattern: 'double', alternateWeekType: 'single' },
      [
        { date: '2026-09-20', status: 'makeup', label: '调休上班', source: 'api' },
        { date: '2026-09-25', status: 'holiday', label: '中秋节', source: 'api' },
      ],
      {},
    );

    expect(countWorkdays(days)).toBe(22);
    expect(days.find((day) => day.date === '2026-09-20')?.status).toBe('makeup');
    expect(days.find((day) => day.date === '2026-09-25')?.status).toBe('holiday');
    expect(days.find((day) => day.date === '2026-09-27')?.status).toBe('rest');
  });

  it('uses Sunday as the only rest day for single-rest pattern', () => {
    const days = buildCalendarDays('2026-09', { pattern: 'single', alternateWeekType: 'single' }, [], {});

    expect(days.find((day) => day.date === '2026-09-05')?.status).toBe('work');
    expect(days.find((day) => day.date === '2026-09-06')?.status).toBe('rest');
  });

  it('alternates single and double weeks from the selected first week type', () => {
    const days = buildCalendarDays('2026-09', { pattern: 'alternate', alternateWeekType: 'double' }, [], {});

    expect(days.find((day) => day.date === '2026-09-05')?.status).toBe('rest');
    expect(days.find((day) => day.date === '2026-09-12')?.status).toBe('work');
  });

  it('gives user overrides priority over API and pattern', () => {
    const days = buildCalendarDays(
      '2026-09',
      { pattern: 'double', alternateWeekType: 'single' },
      [{ date: '2026-09-20', status: 'makeup', label: '调休上班', source: 'api' }],
      { '2026-09-20': 'rest' },
    );

    expect(days.find((day) => day.date === '2026-09-20')?.status).toBe('rest');
    expect(days.find((day) => day.date === '2026-09-20')?.source).toBe('user');
  });
});
