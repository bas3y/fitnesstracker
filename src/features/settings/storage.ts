import { useEffect, useState } from 'react';

/** Bittet den Browser, die Daten nicht automatisch zu löschen (wichtig v. a. für iOS) */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  try {
    return (await navigator.storage.persisted()) || (await navigator.storage.persist());
  } catch {
    return false;
  }
}

export interface StorageInfo {
  persisted: boolean | null;
  usage: number | null;
  quota: number | null;
}

export function useStorageInfo(): StorageInfo | undefined {
  const [info, setInfo] = useState<StorageInfo>();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const storage = navigator.storage;
      const [persisted, estimate] = await Promise.all([
        storage?.persisted?.().catch(() => null) ?? null,
        storage?.estimate?.().catch(() => null) ?? null,
      ]);
      if (!cancelled) {
        setInfo({
          persisted,
          usage: estimate?.usage ?? null,
          quota: estimate?.quota ?? null,
        });
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return info;
}
