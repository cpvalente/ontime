declare const __brand: unique symbol;
type Brand<B> = { [__brand]: B };
type Branded<T, B> = T & Brand<B>;

/** A timestamp in milliseconds from epoch */
export type Instant = Branded<number, 'instant'>;

/** A timestamp of milliseconds since midnight today in the set timezone */
export type TimeOfDay = Branded<number, 'time-of-day'>;

/** A duration of milliseconds */
export type Duration = Branded<number, 'duration'>;

/** A day count integer */
export type Day = Branded<number, 'day'>;
