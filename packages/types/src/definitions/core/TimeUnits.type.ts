declare const __brand: unique symbol;
type Brand<B> = { [__brand]: B };
type Branded<T, B> = T & Brand<B>;

/**
 * A timestamp of milliseconds since midnight, January 1, 1970 Universal Coordinated Time (UTC)
 */
export type EpochMs = Branded<number, 'epoch'>;

/**
 * A timestamp of milliseconds since midnight today in the set timezone
 */
export type DayMs = Branded<number, 'day'>;

/**
 * A duration of milliseconds
 */
export type DurationMs = Branded<number, 'duration'>;
