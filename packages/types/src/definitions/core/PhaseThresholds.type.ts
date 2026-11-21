/**
 * When a timer enters a phase, counted back from the end of the event
 * - time: the remaining time, in milliseconds
 * - percent: a percentage of the event duration, from 0 to 100
 */
export type PhaseThreshold = { unit: 'time'; value: number } | { unit: 'percent'; value: number };

export type PhaseThresholds = {
  warning: PhaseThreshold;
  danger: PhaseThreshold;
};
