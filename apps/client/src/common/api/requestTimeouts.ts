/**
 * Keep a short global timeout for regular API requests, but allow
 * longer windows for file transfer and heavy import/export operations.
 */
export const axiosConfig = {
  shortTimeout: 20 * 1000, // 20 seconds
  longTimeout: 3 * 60 * 1000, // 3 minutes
} as const;
