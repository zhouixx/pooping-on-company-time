export type WorkPattern = 'single' | 'double' | 'alternate';
export type WeekType = 'single' | 'double';
export type DayStatus = 'work' | 'rest' | 'holiday' | 'makeup';
export type SettlementUnit = 'second' | 'minute' | 'hour';
export type CalendarSource = 'pattern' | 'api' | 'local-fallback' | 'user';

export interface PatternSettings {
  pattern: WorkPattern;
  alternateWeekType: WeekType;
}

export interface CalendarOverlay {
  date: string;
  status: Extract<DayStatus, 'holiday' | 'makeup'>;
  label: string;
  source: Exclude<CalendarSource, 'pattern' | 'user'>;
}

export interface CalendarDay {
  date: string;
  weekday: number;
  isWeekend: boolean;
  status: DayStatus;
  label?: string;
  source: CalendarSource;
}

export type DateOverrides = Record<string, DayStatus | null>;

export interface SalaryInput {
  salary: number;
  workdays: number;
  hoursPerDay: number;
}

export type SalaryErrors = Partial<Record<keyof SalaryInput, string>>;

export interface TimerState {
  status: 'idle' | 'running' | 'paused' | 'finished';
  accumulatedMs: number;
  startedAt: number | null;
  lastUpdatedAt: number | null;
  dailyDate: string;
  dailyEarnings: number;
  finishedEarnings: number | null;
}
