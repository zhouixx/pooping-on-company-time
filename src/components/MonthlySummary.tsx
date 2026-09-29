import { BadgeJapaneseYen, BriefcaseBusiness, CalendarDays, Timer } from 'lucide-react';

interface MonthlySummaryProps {
  workdays: number;
  hoursPerDay: number;
  hourlyRate: number;
  holidayCount: number;
  makeupCount: number;
  offDays: number;
}

function currency(value: number): string {
  return `¥${value.toFixed(2)}`;
}

export function MonthlySummary({ workdays, hoursPerDay, hourlyRate, holidayCount, makeupCount, offDays }: MonthlySummaryProps) {
  return (
    <section className="summary-section" aria-labelledby="summary-title">
      <div className="section-heading section-heading--summary">
        <div><span className="section-kicker">03 · 本月结果</span><h2 id="summary-title">这月的每小时值多少？</h2></div>
        <span className="summary-note">法定假日 {holidayCount} 天 · 调休 {makeupCount} 天</span>
      </div>
      <div className="summary-grid">
        <div className="summary-card summary-card--primary"><BriefcaseBusiness size={18} aria-hidden="true" /><span>本月工作日</span><strong>{workdays}<small>天</small></strong></div>
        <div className="summary-card"><Timer size={18} aria-hidden="true" /><span>预计总工时</span><strong>{(workdays * hoursPerDay).toFixed(1)}<small>小时</small></strong></div>
        <div className="summary-card"><BadgeJapaneseYen size={18} aria-hidden="true" /><span>每小时薪资</span><strong>{currency(hourlyRate)}</strong></div>
        <div className="summary-card"><CalendarDays size={18} aria-hidden="true" /><span>休息日提示</span><strong>{offDays}<small>天</small></strong></div>
      </div>
    </section>
  );
}
