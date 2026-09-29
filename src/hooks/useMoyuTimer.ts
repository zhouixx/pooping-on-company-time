import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createTimerState,
  finishTimerWithEarnings,
  getDateKey,
  getElapsedMs,
  getSettledUnits,
  getTodayEarnings,
  getTimerEarnings,
  normalizeTimerState,
  pauseTimer,
  resetTimer,
  resumeTimer,
  startTimer,
} from '../domain/timer';
import type { SettlementUnit, TimerState } from '../domain/types';
import { useLocalStorage } from './useLocalStorage';

const TIMER_STORAGE_KEY = 'paid-fishing.timer.v1';

interface UseMoyuTimerOptions {
  hourlyRate: number;
  settlementUnit: SettlementUnit;
  canStart: boolean;
  today?: string;
}

export function useMoyuTimer({ hourlyRate, settlementUnit, canStart, today: providedToday }: UseMoyuTimerOptions) {
  const [now, setNow] = useState(() => Date.now());
  const today = providedToday ?? getDateKey(now);
  const [storedState, setStoredState] = useLocalStorage<TimerState>(TIMER_STORAGE_KEY, createTimerState());
  const state = useMemo(() => normalizeTimerState(storedState, today), [storedState, today]);

  useEffect(() => {
    if (JSON.stringify(storedState) !== JSON.stringify(state)) {
      setStoredState(state);
    }
  }, [setStoredState, state, storedState]);

  useEffect(() => {
    if (state.status !== 'running') {
      return undefined;
    }

    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [state.status]);

  useEffect(() => {
    if (!canStart && state.status === 'running') {
      setStoredState((current) => pauseTimer(normalizeTimerState(current, today), Date.now()));
      setNow(Date.now());
    }
  }, [canStart, setStoredState, state.status, today]);

  const updateState = useCallback((transition: (current: TimerState, timestamp: number) => TimerState) => {
    const timestamp = Date.now();
    setStoredState((current) => transition(normalizeTimerState(current, today), timestamp));
    setNow(timestamp);
  }, [setStoredState, today]);

  const start = useCallback(() => updateState((current, timestamp) => startTimer(current, timestamp, canStart)), [canStart, updateState]);
  const pause = useCallback(() => updateState((current, timestamp) => pauseTimer(current, timestamp)), [updateState]);
  const resume = useCallback(() => updateState((current, timestamp) => resumeTimer(current, timestamp)), [updateState]);
  const finish = useCallback(() => {
    const timestamp = Date.now();
    setStoredState((current) => finishTimerWithEarnings(normalizeTimerState(current, today), timestamp, settlementUnit, hourlyRate));
    setNow(timestamp);
  }, [hourlyRate, settlementUnit, setStoredState, today]);
  const reset = useCallback(() => {
    setStoredState((current) => resetTimer(normalizeTimerState(current, today), today));
    setNow(Date.now());
  }, [setStoredState, today]);

  const elapsedMs = getElapsedMs(state, now);
  const settledUnits = getSettledUnits(elapsedMs, settlementUnit);
  const earnings = state.status === 'finished' && state.finishedEarnings !== null
    ? state.finishedEarnings
    : getTimerEarnings(elapsedMs, settlementUnit, hourlyRate);
  const todayEarnings = getTodayEarnings(state, earnings, today);

  return {
    state,
    elapsedMs,
    settledUnits,
    earnings,
    todayEarnings,
    start,
    pause,
    resume,
    finish,
    reset,
  };
}
