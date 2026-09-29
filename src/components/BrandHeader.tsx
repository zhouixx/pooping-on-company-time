import { CalendarDays, Sparkles } from 'lucide-react';
import { StatusPill } from './StatusPill';

interface BrandHeaderProps {
  month: string;
  source: 'loading' | 'api' | 'fallback';
  onMonthChange: (month: string) => void;
}

export function BrandHeader({ month, source, onMonthChange }: BrandHeaderProps) {
  return (
    <header className="brand-header">
      <div className="brand-copy">
        <div className="eyebrow"><Sparkles size={14} aria-hidden="true" />今日也要算清楚</div>
        <h1>今日进度</h1>
        <p>把每一分钟的快乐，都换算成看得见的收益。</p>
        <div className="brand-meta">
          <label className="month-picker">
            <CalendarDays size={16} aria-hidden="true" />
            <span className="sr-only">选择月份</span>
            <input type="month" value={month} onChange={(event) => onMonthChange(event.target.value)} />
          </label>
          <StatusPill source={source} />
        </div>
      </div>
      <div className="mascot-frame">
        <img src="/moyu-mascot.svg" alt="趴在电脑旁的可爱摸鱼小伙伴" />
        <span className="mascot-sticker">嘘，正在摸鱼</span>
      </div>
    </header>
  );
}
