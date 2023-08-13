interface CacheData {
  data: unknown;
}

const runtimeCache: Map<string, CacheData> = new Map();

export function checkCached(key: string): boolean {
  return runtimeCache.has(key);
}

export function getCached<T>(key: string, callback: () => T): T {
  if (!runtimeCache.has(key)) {
    try {
      const data = callback();
      runtimeCache.set(key, { data });
    } catch (error) {
      console.log(`Failed retrieving data from callback: ${error}`);
    }
  }

  return runtimeCache.get(key).data as T;
}

export function setCached<T>(key: string, value: T): T {
  runtimeCache.set(key, { data: value });
  return runtimeCache.get(key).data as T;
}

export function invalidate(key) {
  runtimeCache.delete(key);
}

export function clear() {
  runtimeCache.clear();
}

function createCacheStore() {
  return {
    checkCached,
    getCached,
    setCached,
    invalidate,
    clear,
  };
}

export const runtimeCacheStore = createCacheStore();
