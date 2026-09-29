import { useMemo } from 'react';
import { buildCalendarDays, countWorkdays } from './domain/workdayCalculator';
import { calculateHourlyRate, validateSalaryInputs } from './domain/salaryCalculator';
import type { DateOverrides, SettlementUnit, WeekType, WorkPattern } from './domain/types';
import { useCalendar } from './hooks/useCalendar';
import { useMoyuTimer } from './hooks/useMoyuTimer';
import { BrandHeader } from './components/BrandHeader';
import { ErrorPill } from './components/StatusPill';
import { MonthCalendar } from './components/MonthCalendar';
import { MonthlySummary } from './components/MonthlySummary';
import { MoyuTimer } from './components/MoyuTimer';
import { PaySettings } from './components/PaySettings';
import { SchedulePicker } from './components/SchedulePicker';
import { StepNavigation } from './components/StepNavigation';
import { getStepFromPath } from './domain/steps';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getDateKey } from './domain/timer';

export interface AppSettings {
  month: string;
  salary: number;
  hoursPerDay: number;
  pattern: WorkPattern;
  alternateWeekType: WeekType;
  settlementUnit: SettlementUnit;
  overrides: DateOverrides;
}

const DEFAULT_SETTINGS: AppSettings = {
  month: '2026-09',
  salary: 18_000,
  hoursPerDay: 8,
  pattern: 'double',
  alternateWeekType: 'single',
  settlementUnit: 'minute',
  overrides: {},
};

const SETTINGS_STORAGE_KEY = 'paid-fishing.settings.v1';

function todayIso(): string {
  return getDateKey();
}

interface AppProps {
  initialToday?: string;
  initialPath?: string;
}

export default function App({ initialToday = todayIso(), initialPath }: AppProps) {
  const [settings, setSettings] = useLocalStorage<AppSettings>(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS);
  const currentStep = getStepFromPath(initialPath ?? (typeof window === 'undefined' ? '/' : window.location.pathname));
  const year = Number(settings.month.slice(0, 4));
  const calendarState = useCalendar(year);
  const days = useMemo(() => buildCalendarDays(settings.month, settings, calendarState.overlays, settings.overrides), [calendarState.overlays, settings]);
  const workdays = useMemo(() => countWorkdays(days), [days]);
  const salaryErrors = useMemo(() => validateSalaryInputs({ salary: settings.salary, workdays, hoursPerDay: settings.hoursPerDay }), [settings.hoursPerDay, settings.salary, workdays]);
  const hourlyRate = calculateHourlyRate(settings.salary, workdays, settings.hoursPerDay);
  const todayDay = days.find((day) => day.date === initialToday);
  const canStart = Boolean(todayDay && (todayDay.status === 'work' || todayDay.status === 'makeup') && Object.keys(salaryErrors).length === 0);
  const timer = useMoyuTimer({ hourlyRate, settlementUnit: settings.settlementUnit, canStart, today: initialToday });

  const updateSettings = (patch: Partial<AppSettings>) => setSettings((current) => ({ ...current, ...patch }));
  const updateOverride = (date: string, status: AppSettings['overrides'][string] | null) => {
    updateSettings({ overrides: { ...settings.overrides, [date]: status } });
  };

  const holidayCount = days.filter((day) => day.status === 'holiday').length;
  const makeupCount = days.filter((day) => day.status === 'makeup').length;
  const offDays = days.filter((day) => day.status === 'rest' || day.status === 'holiday').length;

  return (
    <main className="app-shell">
      <BrandHeader month={settings.month} source={calendarState.source} onMonthChange={(month) => updateSettings({ month })} />
      <StepNavigation currentStep={currentStep} />
      <ErrorPill message={calendarState.error} />
      {currentStep === 1 && <SchedulePicker pattern={settings.pattern} alternateWeekType={settings.alternateWeekType} onPatternChange={(pattern) => updateSettings({ pattern })} onAlternateWeekTypeChange={(alternateWeekType) => updateSettings({ alternateWeekType })} />}
      {currentStep === 2 && <PaySettings salary={settings.salary} hoursPerDay={settings.hoursPerDay} errors={{ salary: salaryErrors.salary, hoursPerDay: salaryErrors.hoursPerDay }} onSalaryChange={(salary) => updateSettings({ salary })} onHoursChange={(hoursPerDay) => updateSettings({ hoursPerDay })} />}
      {currentStep === 3 && <MonthlySummary workdays={workdays} hoursPerDay={settings.hoursPerDay} hourlyRate={hourlyRate} holidayCount={holidayCount} makeupCount={makeupCount} offDays={offDays} />}
      {currentStep === 4 && <MonthCalendar month={settings.month} days={days} overrides={settings.overrides} onOverride={updateOverride} />}
      {currentStep === 5 && <MoyuTimer state={timer.state} settledUnits={timer.settledUnits} earnings={timer.earnings} todayEarnings={timer.todayEarnings} settlementUnit={settings.settlementUnit} canStart={canStart} onUnitChange={(settlementUnit) => updateSettings({ settlementUnit })} onStart={timer.start} onPause={timer.pause} onResume={timer.resume} onFinish={timer.finish} onReset={timer.reset} />}
      <footer className="app-footer">工资按税前月薪计算 · 日历接口不可用时使用本地数据</footer>
    </main>
  );
}
