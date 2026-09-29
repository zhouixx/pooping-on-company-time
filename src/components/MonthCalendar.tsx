import { CalendarDays, PencilLine } from 'lucide-react';
import type { CalendarDay, DateOverrides, DayStatus } from '../domain/types';

interface MonthCalendarProps {
  month: string;
  days: CalendarDay[];
  overrides: DateOverrides;
  onOverride: (date: string, status: DayStatus | null) => void;
}

const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日'];
const statusLabels: Record<DayStatus, string> = { work: '工作', rest: '休息', holiday: '法定假日', makeup: '调休上班' };
const cycle: Array<DayStatus | null> = ['work', 'rest', 'holiday', 'makeup', null];

function monthLabel(month: string): string {
  const [year, monthNumber] = month.split('-');
  return `${year} 年 ${Number(monthNumber)} 月`;
}

function nextOverride(current: DayStatus | null | undefined): DayStatus | null {
  const index = cycle.indexOf(current ?? null);
  return cycle[(index + 1) % cycle.length] ?? null;
}

export function MonthCalendar({ month, days, overrides, onOverride }: MonthCalendarProps) {
  const leadingBlankCount = days[0] ? (days[0].weekday + 6) % 7 : 0;

  return (
    <section className="section-block" aria-labelledby="calendar-title">
      <div className="section-heading">
        <div><span className="section-kicker">04 · 月历</span><h2 id="calendar-title">{monthLabel(month)}的工作节奏</h2></div>
        <CalendarDays size={22} aria-hidden="true" />
      </div>
      <div className="calendar-legend" aria-label="日历图例">
        <span><i className="legend-dot legend-dot--work" />工作日</span><span><i className="legend-dot legend-dot--rest" />休息日</span><span><i className="legend-dot legend-dot--holiday" />法定假日</span><span><i className="legend-dot legend-dot--makeup" />调休上班</span>
      </div>
      <div className="calendar-grid" role="grid" aria-label={`${monthLabel(month)}日历`}>
        {weekdayLabels.map((label) => <span key={label} className="calendar-weekday">{label}</span>)}
        {Array.from({ length: leadingBlankCount }, (_, index) => <span key={`blank-${index}`} className="calendar-day calendar-day--blank" aria-hidden="true" />)}
        {days.map((day) => {
          const isOverridden = Object.prototype.hasOwnProperty.call(overrides, day.date) && overrides[day.date] !== null;
          return (
            <button
              key={day.date}
              type="button"
              role="gridcell"
              className={`calendar-day calendar-day--${day.status} ${isOverridden ? 'is-overridden' : ''}`}
              title={`${day.date} · ${day.label ?? statusLabels[day.status]} · 点击修正`}
              aria-label={`${day.date} ${day.label ?? statusLabels[day.status]}`}
              onClick={() => onOverride(day.date, nextOverride(overrides[day.date]))}
            >
              <strong>{Number(day.date.slice(-2))}</strong>
              <span>{day.label ?? statusLabels[day.status]}</span>
              {isOverridden && <PencilLine size={11} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      <p className="calendar-hint">点击日期可做本地修正，修改只保存在当前浏览器。</p>
    </section>
  );
}
