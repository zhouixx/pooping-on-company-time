import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useLocalStorage } from '../useLocalStorage';

const KEY = 'paid-fishing.storage-test.v1';

function clearCookie() {
  document.cookie = `${KEY}=; Max-Age=0; Path=/`;
}

describe('useLocalStorage', () => {
  beforeEach(() => {
    clearCookie();
    window.localStorage.clear();
  });

  it('restores an existing localStorage value', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ count: 3 }));

    const result = renderHook(() => useLocalStorage(KEY, { count: 0 }));

    expect(result.result.current[0]).toEqual({ count: 3 });
  });

  it('migrates a newer cookie value into localStorage and deletes the cookie', async () => {
    window.localStorage.setItem(KEY, JSON.stringify({ count: 3 }));
    document.cookie = `${KEY}=${encodeURIComponent(JSON.stringify({ count: 7 }))}; Path=/`;

    const result = renderHook(() => useLocalStorage(KEY, { count: 0 }));

    expect(result.result.current[0]).toEqual({ count: 7 });
    await waitFor(() => expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify({ count: 7 })));
    await waitFor(() => expect(document.cookie).not.toContain(`${KEY}=`));
  });
});
