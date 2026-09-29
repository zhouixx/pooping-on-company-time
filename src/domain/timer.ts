import type { SettlementUnit, TimerState } from './types';

const UNIT_MILLISECONDS: Record<SettlementUnit, number> = {
  second: 1_000,
  minute: 60_000,
  hour: 3_600_000,
};

const UNITS_PER_HOUR: Record<SettlementUnit, number> = {
  second: 3_600,
  minute: 60,
  hour: 1,
};

export function createTimerState(): TimerState {
  return createTimerStateForDate(getDateKey());
}

export function getDateKey(timestamp = Date.now()): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createTimerStateForDate(dateKey: string): TimerState {
  return {
    status: 'idle',
    accumulatedMs: 0,
    startedAt: null,
    lastUpdatedAt: null,
    dailyDate: dateKey,
    dailyEarnings: 0,
    finishedEarnings: null,
  };
}

function isTimerStatus(value: unknown): value is TimerState['status'] {
  return value === 'idle' || value === 'running' || value === 'paused' || value === 'finished';
}

function finiteNonNegative(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function normalizeTimerState(value: unknown, today = getDateKey()): TimerState {
  if (!value || typeof value !== 'object') {
    return createTimerStateForDate(today);
  }

  const raw = value as Partial<TimerState>;
  const dailyDate = typeof raw.dailyDate === 'string' ? raw.dailyDate : today;
  if (dailyDate !== today || !isTimerStatus(raw.status)) {
    return createTimerStateForDate(today);
  }

  return {
    status: raw.status,
    accumulatedMs: finiteNonNegative(raw.accumulatedMs, 0),
    startedAt: typeof raw.startedAt === 'number' && Number.isFinite(raw.startedAt) ? raw.startedAt : null,
    lastUpdatedAt: typeof raw.lastUpdatedAt === 'number' && Number.isFinite(raw.lastUpdatedAt) ? raw.lastUpdatedAt : null,
    dailyDate,
    dailyEarnings: finiteNonNegative(raw.dailyEarnings, 0),
    finishedEarnings: raw.finishedEarnings === null || raw.finishedEarnings === undefined ? null : finiteNonNegative(raw.finishedEarnings, 0),
  };
}

function elapsedSinceStart(state: TimerState, now: number): number {
  if (state.status !== 'running' || state.startedAt === null) {
    return 0;
  }
  return Math.max(0, now - state.startedAt);
}

export function startTimer(state: TimerState, now = Date.now(), canStart = true): TimerState {
  if (!canStart) {
    throw new Error('今天不用上班，安心休息');
  }
  if (state.status === 'running') {
    return state;
  }
  const freshSession = state.status === 'finished'
    ? { ...state, status: 'idle' as const, accumulatedMs: 0, startedAt: null, finishedEarnings: null }
    : state;
  return {
    ...freshSession,
    status: 'running',
    startedAt: now,
    lastUpdatedAt: now,
  };
}

export function pauseTimer(state: TimerState, now = Date.now()): TimerState {
  if (state.status !== 'running') {
    return state;
  }
  return {
    ...state,
    status: 'paused',
    accumulatedMs: state.accumulatedMs + elapsedSinceStart(state, now),
    startedAt: null,
    lastUpdatedAt: now,
    finishedEarnings: null,
  };
}

export function resumeTimer(state: TimerState, now = Date.now()): TimerState {
  if (state.status !== 'paused') {
    return state;
  }
  return {
    ...state,
    status: 'running',
    startedAt: now,
    lastUpdatedAt: now,
  };
}

export function finishTimer(state: TimerState, now = Date.now()): TimerState {
  if (state.status !== 'running') {
    return state.status === 'paused' ? { ...state, status: 'finished', lastUpdatedAt: now, finishedEarnings: null } : state;
  }
  return {
    ...state,
    status: 'finished',
    accumulatedMs: state.accumulatedMs + elapsedSinceStart(state, now),
    startedAt: null,
    lastUpdatedAt: now,
    finishedEarnings: null,
  };
}

export function finishTimerWithEarnings(state: TimerState, now: number, unit: SettlementUnit, hourlyRate: number): TimerState {
  if (state.status !== 'running' && state.status !== 'paused') {
    return state;
  }

  const finished = finishTimer(state, now);
  const sessionEarnings = getTimerEarnings(getElapsedMs(finished, now), unit, hourlyRate);
  return {
    ...finished,
    dailyEarnings: state.dailyEarnings + sessionEarnings,
    finishedEarnings: sessionEarnings,
  };
}

export function resetTimer(state?: TimerState, today = state?.dailyDate ?? getDateKey()): TimerState {
  const next = createTimerStateForDate(today);
  if (state?.dailyDate === today) {
    next.dailyEarnings = state.dailyEarnings;
  }
  return next;
}

export function getElapsedMs(state: TimerState, now = Date.now()): number {
  return state.accumulatedMs + elapsedSinceStart(state, now);
}

export function getSettledUnits(elapsedMs: number, unit: SettlementUnit): number {
  return Math.max(0, Math.floor(elapsedMs / UNIT_MILLISECONDS[unit]));
}

export function getTimerEarnings(elapsedMs: number, unit: SettlementUnit, hourlyRate: number): number {
  const units = getSettledUnits(elapsedMs, unit);
  return units * hourlyRate / UNITS_PER_HOUR[unit];
}

export function getTodayEarnings(state: TimerState, currentSessionEarnings: number, today = getDateKey()): number {
  if (state.dailyDate !== today) {
    return 0;
  }

  const activeSessionEarnings = state.status === 'running' || state.status === 'paused' ? currentSessionEarnings : 0;
  return state.dailyEarnings + activeSessionEarnings;
}
