import { describe, expect, it } from 'vitest';
import {
  createTimerState,
  createTimerStateForDate,
  getElapsedMs,
  getSettledUnits,
  getTimerEarnings,
  normalizeTimerState,
  pauseTimer,
  resetTimer,
  resumeTimer,
  startTimer,
} from '../timer';

describe('timer', () => {
  it('settles one minute as hourlyRate divided by 60', () => {
    expect(getSettledUnits(60_000, 'minute')).toBe(1);
    expect(getTimerEarnings(60_000, 'minute', 120)).toBe(2);
  });

  it('supports second, minute, and hour units without changing accumulated time', () => {
    expect(getSettledUnits(3_600_000, 'second')).toBe(3600);
    expect(getSettledUnits(3_600_000, 'minute')).toBe(60);
    expect(getSettledUnits(3_600_000, 'hour')).toBe(1);
  });

  it('pauses and resumes from the accumulated milliseconds', () => {
    const running = startTimer(createTimerState(), 1_000);
    const paused = pauseTimer(running, 61_000);
    expect(paused.accumulatedMs).toBe(60_000);
    const resumed = resumeTimer(paused, 120_000);
    expect(getElapsedMs(resumed, 180_000)).toBe(120_000);
  });

  it('does not start when the current date is not a workday', () => {
    expect(() => startTimer(createTimerState(), 1_000, false)).toThrow('今天不用上班，安心休息');
  });

  it('resets the state after a finished session', () => {
    const finished = pauseTimer(startTimer(createTimerState(), 1_000), 31_000);
    expect(resetTimer(finished)).toEqual(createTimerState());
  });

  it('starts with a clean timer when persisted state belongs to yesterday', () => {
    const yesterday = createTimerStateForDate('2026-09-20');
    yesterday.dailyEarnings = 12.5;
    yesterday.status = 'paused';
    yesterday.accumulatedMs = 60_000;

    expect(normalizeTimerState(yesterday, '2026-09-21')).toEqual(createTimerStateForDate('2026-09-21'));
  });
});
