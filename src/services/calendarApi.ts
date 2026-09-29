import type { CalendarOverlay } from '../domain/types';
import { getFallbackOverlays } from './fallbackCalendar';

const API_URL = 'https://timor.tech/api/holiday/year';
const DEFAULT_TIMEOUT_MS = 6_000;

type Fetcher = typeof fetch;
type CalendarApiResult = {
  overlays: CalendarOverlay[];
  source: 'api' | 'fallback';
  error?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isDateString(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function collectDates(value: Record<string, unknown>): string[] {
  const dates = new Set<string>();
  if (isDateString(value.date)) {
    dates.add(value.date);
  }
  if (Array.isArray(value.list)) {
    value.list.filter(isDateString).forEach((date) => dates.add(date));
  }
  return [...dates];
}

function inferStatus(label: string, value: Record<string, unknown>): CalendarOverlay['status'] {
  const normalizedLabel = label.toLowerCase();
  if (normalizedLabel.includes('调休') || normalizedLabel.includes('上班') || value.rest === 0 || value.holiday === false) {
    return 'makeup';
  }
  return 'holiday';
}

function normalizePayload(payload: unknown): CalendarOverlay[] {
  if (!isRecord(payload) || !isRecord(payload.holiday)) {
    throw new Error('日历接口返回格式异常');
  }

  const overlays: CalendarOverlay[] = [];
  for (const [key, rawValue] of Object.entries(payload.holiday)) {
    if (!isRecord(rawValue)) {
      continue;
    }
    const label = typeof rawValue.name === 'string' ? rawValue.name : key;
    const status = inferStatus(label, rawValue);
    for (const date of collectDates(rawValue)) {
      overlays.push({ date, status, label, source: 'api' });
    }
  }

  if (overlays.length === 0) {
    throw new Error('日历接口未返回有效日期');
  }

  return overlays;
}

function fallbackResult(year: number, error: unknown): CalendarApiResult {
  const message = error instanceof Error ? error.message : '未知错误';
  return {
    overlays: getFallbackOverlays(year),
    source: 'fallback',
    error: `日历接口不可用：${message}`,
  };
}

export async function fetchCalendarOverlays(
  year: number,
  fetcher: Fetcher = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<CalendarApiResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetcher(`${API_URL}/${year}`, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload: unknown = await response.json();
    return { overlays: normalizePayload(payload), source: 'api' };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return fallbackResult(year, new Error('请求超时'));
    }
    return fallbackResult(year, error);
  } finally {
    clearTimeout(timeout);
  }
}
