import { CalendarClock } from 'lucide-react';
import type { WeekType, WorkPattern } from '../domain/types';

interface SchedulePickerProps {
  pattern: WorkPattern;
  alternateWeekType: WeekType;
  onPatternChange: (pattern: WorkPattern) => void;
  onAlternateWeekTypeChange: (weekType: WeekType) => void;
}

const patternOptions: Array<{ value: WorkPattern; label: string; detail: string }> = [
  { value: 'single', label: '单休', detail: '周日休息' },
  { value: 'double', label: '双休', detail: '周六、日休息' },
  { value: 'alternate', label: '大小周', detail: '单双周交替' },
];

export function SchedulePicker({ pattern, alternateWeekType, onPatternChange, onAlternateWeekTypeChange }: SchedulePickerProps) {
  return (
    <section className="section-block" aria-labelledby="schedule-title">
      <div className="section-heading">
        <div><span className="section-kicker">01 · 工作节奏</span><h2 id="schedule-title">你是哪种休息节奏？</h2></div>
        <CalendarClock size={22} aria-hidden="true" />
      </div>
      <div className="segmented-grid segmented-grid--three" role="radiogroup" aria-label="工作节奏">
        {patternOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`choice-button ${pattern === option.value ? 'is-selected' : ''}`}
            role="radio"
            aria-checked={pattern === option.value}
            onClick={() => onPatternChange(option.value)}
          >
            <strong>{option.label}</strong><span>{option.detail}</span>
          </button>
        ))}
      </div>
      {pattern === 'alternate' && (
        <div className="sub-choice">
          <span>本周先从哪种开始？</span>
          <div className="segmented-grid segmented-grid--two" role="radiogroup" aria-label="大小周当前周类型">
            <button type="button" className={`choice-button choice-button--compact ${alternateWeekType === 'single' ? 'is-selected' : ''}`} role="radio" aria-checked={alternateWeekType === 'single'} onClick={() => onAlternateWeekTypeChange('single')}>
              单休周
            </button>
            <button type="button" className={`choice-button choice-button--compact ${alternateWeekType === 'double' ? 'is-selected' : ''}`} role="radio" aria-checked={alternateWeekType === 'double'} onClick={() => onAlternateWeekTypeChange('double')}>
              双休周
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
