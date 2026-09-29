import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

function readCookie<T>(key: string): T | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const encodedKey = encodeURIComponent(key);
  const entry = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${encodedKey}=`));

  if (!entry) {
    return undefined;
  }

  try {
    return JSON.parse(decodeURIComponent(entry.slice(encodedKey.length + 1))) as T;
  } catch {
    return undefined;
  }
}

function readValue<T>(key: string, initialValue: T): T {
  if (typeof window === 'undefined') {
    return initialValue;
  }

  const cookieValue = readCookie<T>(key);
  if (cookieValue !== undefined) {
    return cookieValue;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? initialValue : (JSON.parse(raw) as T);
  } catch {
    return initialValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readValue(key, initialValue));

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      document.cookie = `${encodeURIComponent(key)}=; Max-Age=0; Path=/; SameSite=Lax`;
    } catch {
      // Storage may be unavailable in private browsing; in-memory state remains usable.
    }
  }, [key, value]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key || event.newValue === null) {
        return;
      }
      try {
        setValue(JSON.parse(event.newValue) as T);
      } catch {
        // Ignore malformed values written by another tab.
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  return [value, setValue];
}
