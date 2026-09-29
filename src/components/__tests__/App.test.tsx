import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';

const { mockFetchCalendarOverlays } = vi.hoisted(() => ({
  mockFetchCalendarOverlays: vi.fn(),
}));

vi.mock('../../services/calendarApi', () => ({
  fetchCalendarOverlays: mockFetchCalendarOverlays,
}));

describe('App', () => {
  beforeEach(() => {
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0]?.trim();
      if (name) {
        document.cookie = `${name}=; Max-Age=0; Path=/`;
      }
    });
    window.localStorage.clear();
    mockFetchCalendarOverlays.mockResolvedValue({
      source: 'fallback',
      overlays: [
        { date: '2026-09-20', status: 'makeup', label: '调休上班', source: 'local-fallback' },
        { date: '2026-09-25', status: 'holiday', label: '中秋节', source: 'local-fallback' },
      ],
    });
  });

  it('renders schedule, salary summary, calendar, and timer sections', async () => {
    render(<App initialPath="/03" />);

    expect(screen.getByRole('heading', { name: '今日进度' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '带薪摸鱼' })).not.toBeInTheDocument();
    expect(screen.getByText('本月工作日')).toBeInTheDocument();
    expect(screen.getByText('每小时薪资')).toBeInTheDocument();
    expect(await screen.findByText('数据来源：本地数据')).toBeInTheDocument();
  });

  it('disables the timer on a rest day and shows the rest message', async () => {
    render(<App initialToday="2026-09-27" initialPath="/05" />);

    await waitFor(() => expect(screen.getByRole('button', { name: '开始摸鱼' })).toBeDisabled());
    expect(screen.getByText('今天不用上班，安心休息')).toBeInTheDocument();
  });

  it('switches settlement units without resetting elapsed time', async () => {
    const user = userEvent.setup();
    render(<App initialToday="2026-09-21" initialPath="/05" />);

    await user.click(await screen.findByRole('button', { name: '开始摸鱼' }));
    expect(screen.getByLabelText('已摸 0 分钟')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: '按小时' }));
    expect(screen.getByText('按小时')).toBeInTheDocument();
    expect(screen.queryByLabelText('已摸 0 分钟')).not.toBeInTheDocument();
  });

  it('renders only the selected step for each same-origin path', async () => {
    render(<App initialPath="/02" />);

    expect(screen.getByText('02 · 薪资设置')).toBeInTheDocument();
    expect(screen.getByLabelText('税前月薪')).toBeInTheDocument();
    expect(screen.queryByText('01 · 工作节奏')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /03 · 本月结果/ })).toHaveAttribute('href', '/03');
  });

  it('shows today earnings on the fifth step', async () => {
    render(<App initialPath="/05" />);

    expect(await screen.findByText('今日已赚')).toBeInTheDocument();
    expect(screen.getAllByText('¥0.00')).toHaveLength(2);
  });
});
