import { CircleStop, Pause, Play, RotateCcw } from 'lucide-react';
import type { SettlementUnit, TimerState } from '../domain/types';

interface MoyuTimerProps {
  state: TimerState;
  settledUnits: number;
  earnings: number;
  todayEarnings: number;
  settlementUnit: SettlementUnit;
  canStart: boolean;
  onUnitChange: (unit: SettlementUnit) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onReset: () => void;
}

const unitOptions: Array<{ value: SettlementUnit; label: string; suffix: string }> = [
  { value: 'second', label: '按秒', suffix: '秒' },
  { value: 'minute', label: '按分钟', suffix: '分钟' },
  { value: 'hour', label: '按小时', suffix: '小时' },
];

export function MoyuTimer({ state, settledUnits, earnings, todayEarnings, settlementUnit, canStart, onUnitChange, onStart, onPause, onResume, onFinish, onReset }: MoyuTimerProps) {
  const selectedUnit = unitOptions.find((option) => option.value === settlementUnit) ?? unitOptions[1];
  const isDisabled = state.status === 'idle' && !canStart;

  return (
    <section className="timer-section" aria-labelledby="timer-title">
      <div className="timer-heading"><div><span className="section-kicker">05 · 摸鱼计时器</span><h2 id="timer-title">把这一刻记下来</h2></div><span className={`timer-state timer-state--${state.status}`}>{state.status === 'running' ? '正在摸鱼' : state.status === 'paused' ? '已暂停' : state.status === 'finished' ? '本次已结束' : '准备就绪'}</span></div>
      <div className="unit-switch" role="radiogroup" aria-label="收益结算单位">
        {unitOptions.map((option) => <button key={option.value} type="button" role="radio" aria-checked={settlementUnit === option.value} className={settlementUnit === option.value ? 'is-selected' : ''} onClick={() => onUnitChange(option.value)}>{option.label}</button>)}
      </div>
      <div className="timer-readout"><div><span className="timer-label">本次收益</span><strong>¥{earnings.toFixed(2)}</strong></div><div className="timer-today-earnings"><span className="timer-label">今日已赚</span><strong>¥{todayEarnings.toFixed(2)}</strong></div><div className="timer-units" aria-label={`已摸 ${settledUnits} ${selectedUnit.suffix}`}><span>已摸</span><b>{settledUnits}</b><em>{selectedUnit.suffix}</em></div></div>
      {!canStart && state.status === 'idle' && <p className="rest-message">今天不用上班，安心休息</p>}
      <div className="timer-actions">
        {state.status === 'idle' && <button type="button" className="action-button action-button--primary" aria-label="开始摸鱼" disabled={isDisabled} onClick={onStart}><Play size={17} fill="currentColor" aria-hidden="true" />开始摸鱼</button>}
        {state.status === 'running' && <><button type="button" className="action-button action-button--primary" onClick={onPause}><Pause size={17} fill="currentColor" aria-hidden="true" />暂停摸鱼</button><button type="button" className="action-button action-button--quiet" onClick={onFinish}><CircleStop size={17} aria-hidden="true" />结束本次</button></>}
        {state.status === 'paused' && <><button type="button" className="action-button action-button--primary" onClick={onResume}><Play size={17} fill="currentColor" aria-hidden="true" />继续摸鱼</button><button type="button" className="action-button action-button--quiet" onClick={onFinish}><CircleStop size={17} aria-hidden="true" />结束本次</button></>}
        {state.status === 'finished' && <button type="button" className="action-button action-button--quiet" onClick={onReset}><RotateCcw size={17} aria-hidden="true" />重置计时</button>}
      </div>
    </section>
  );
}
