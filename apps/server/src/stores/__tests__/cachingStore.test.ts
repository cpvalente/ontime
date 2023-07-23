import { runtimeCacheStore } from '../cachingStore.js';

describe('cachingStore()', () => {
  beforeEach(() => {
    runtimeCacheStore.clear(); // Clear the cache before each test
  });

  it('should check if an item is cached', () => {
    // Add an item to the cache
    runtimeCacheStore.setCached('key', 'value');

    // Check if the item is cached
    expect(runtimeCacheStore.checkCached('key')).toBe(true);
    expect(runtimeCacheStore.checkCached('non-existent-key')).toBe(false);
  });

  it('should get an item from the cache', () => {
    // Add an item to the cache
    runtimeCacheStore.setCached('key', 'value');

    // Get the item from the cache
    const result = runtimeCacheStore.getCached('key', () => 'default-value');

    // Check the returned value
    expect(result).toBe('value');
  });

  it('should retrieve default value when item is not cached', () => {
    // Get an item that is not in the cache
    const result = runtimeCacheStore.getCached('non-existent-key', () => 'default-value');

    // Check the returned value
    expect(result).toBe('default-value');
  });

  it('should set an item in the cache', () => {
    // Set an item in the cache
    runtimeCacheStore.setCached('key', 'value');

    // Check if the item is cached
    expect(runtimeCacheStore.checkCached('key')).toBe(true);
  });

  it('should invalidate an item in the cache', () => {
    // Add an item to the cache
    runtimeCacheStore.setCached('key', 'value');

    // Invalidate the item
    runtimeCacheStore.invalidate('key');

    // Check if the item is no longer cached
    expect(runtimeCacheStore.checkCached('key')).toBe(false);
  });

  it('should clear the cache', () => {
    // Add items to the cache
    runtimeCacheStore.setCached('key1', 'value1');
    runtimeCacheStore.setCached('key2', 'value2');

    // Clear the cache
    runtimeCacheStore.clear();

    // Check if the cache is empty
    expect(runtimeCacheStore.checkCached('key1')).toBe(false);
    expect(runtimeCacheStore.checkCached('key2')).toBe(false);
  });
});
