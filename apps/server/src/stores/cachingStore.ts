interface CacheData {
  data: any;
}

const runtimeCache: Map<string, CacheData> = new Map();

export function getCached<T>(key: string, callback: () => T): T {
  if (!Object.hasOwn(runtimeCache, key)) {
    try {
      const data = callback();
      runtimeCache.set(key, { data });
    } catch (error) {
      console.log(`Failed retrieving data from callback: ${error}`);
    }
  }

  return runtimeCache.get(key).data as T;
}

export function invalidate(key) {
  runtimeCache.delete(key);
}

export function clear() {
  runtimeCache.clear();
}
