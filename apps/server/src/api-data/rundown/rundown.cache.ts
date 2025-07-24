import { LRUCache } from 'lru-cache';
import { Rundown } from 'ontime-types';

const options = {
  max: 10,
  // 1 hour
  ttl: 1000 * 60 * 60,
};

export const rundownCache = new LRUCache<string, Rundown>(options);
