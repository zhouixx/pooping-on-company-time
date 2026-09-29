import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMoyuTimer } from '../useMoyuTimer';

function TimerHarness({ unit = 'minute' as const }: { unit?: 'second' | 'minute' | 'hour' }) {
  const timer = useMoyuTimer({ hourlyRate: 120, settlementUnit: unit, canStart: true });
  return (
    <div>
      <output data-testid="elapsed">{timer.elapsedMs}</output>
      <output data-testid="units">{timer.settledUnits}</output>
      <output data-testid="earnings">{timer.earnings}</output>
      <output data-testid="today-earnings">{timer.todayEarnings}</output>
      <button onClick={timer.start}>开始</button>
      <button onClick={timer.pause}>暂停</button>
      <button onClick={timer.finish}>结束</button>
      <button onClick={timer.reset}>重置</button>
    </div>
  );
}

describe('useMoyuTimer', () => {
  beforeEach(() => {
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0]?.trim();
      if (name) {
        document.cookie = `${name}=; Max-Age=0; Path=/`;
      }
    });
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-21T09:00:00.000Z'));
  });

  it('persists a running timer and restores elapsed milliseconds on remount', () => {
    const first = render(<TimerHarness />);

    fireEvent.click(screen.getByRole('button', { name: '开始' }));
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId('units')).toHaveTextContent('1');
    expect(screen.getByTestId('earnings')).toHaveTextContent('2');
    expect(screen.getByTestId('today-earnings')).toHaveTextContent('2');

    first.unmount();
    render(<TimerHarness />);
    expect(screen.getByTestId('elapsed')).toHaveTextContent('60000');
    expect(screen.getByTestId('units')).toHaveTextContent('1');
  });

  it('adds a finished session to today earnings and keeps it after reset', () => {
    render(<TimerHarness />);

    fireEvent.click(screen.getByRole('button', { name: '开始' }));
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    fireEvent.click(screen.getByRole('button', { name: '结束' }));

    expect(screen.getByTestId('today-earnings')).toHaveTextContent('2');
    fireEvent.click(screen.getByRole('button', { name: '重置' }));
    expect(screen.getByTestId('earnings')).toHaveTextContent('0');
    expect(screen.getByTestId('today-earnings')).toHaveTextContent('2');
  });
});
