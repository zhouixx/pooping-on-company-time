import { describe, expect, it, vi } from 'vitest';
import { fetchCalendarOverlays } from '../calendarApi';

describe('calendarApi', () => {
  it('normalizes holiday and makeup dates from provider payload', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      holiday: {
        中秋节: { name: '中秋节', list: ['2026-09-25', '2026-09-26', '2026-09-27'], rest: 1 },
        调休: { name: '调休上班', list: ['2026-09-20'], rest: 0 },
      },
    }), { status: 200 }));

    const result = await fetchCalendarOverlays(2026, fetcher, 100);

    expect(result.source).toBe('api');
    expect(result.overlays).toEqual(expect.arrayContaining([
      expect.objectContaining({ date: '2026-09-25', status: 'holiday', label: '中秋节' }),
      expect.objectContaining({ date: '2026-09-20', status: 'makeup', label: '调休上班' }),
    ]));
  });

  it('falls back when the request fails', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('timeout'));

    const result = await fetchCalendarOverlays(2026, fetcher, 1);

    expect(result.source).toBe('fallback');
    expect(result.overlays).toEqual(expect.arrayContaining([
      expect.objectContaining({ date: '2026-09-20', status: 'makeup' }),
      expect.objectContaining({ date: '2026-09-25', status: 'holiday' }),
    ]));
    expect(result.error).toBeTruthy();
  });

  it('falls back on a non-success response', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('unavailable', { status: 503 }));

    const result = await fetchCalendarOverlays(2026, fetcher, 100);

    expect(result.source).toBe('fallback');
    expect(result.error).toContain('503');
  });
});
