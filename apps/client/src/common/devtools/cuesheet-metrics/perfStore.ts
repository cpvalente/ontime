/**
 * PERF-METRICS — temporary cuesheet scroll-performance scaffold (delete with this directory).
 *
 * Plain module singleton (no zustand): the metrics are surfaced via the console only, so there
 * is no React subscriber that would justify a reactive store. Everything here is a no-op unless
 * a session is running, and call sites are additionally gated by PERF_ENABLED.
 */

/** A frame slower than ~1.5 frames at 60fps is counted as a "long frame". */
const LONG_FRAME_MS = (1000 / 60) * 1.5;

interface MarkStat {
  count: number;
  totalMs: number;
  maxMs: number;
}

interface PerfState {
  running: boolean;
  marks: Record<string, MarkStat>;
  rowsMounted: number;
  frameCount: number;
  totalFrameMs: number;
  maxFrameMs: number;
  longFrames: number;
}

function createState(): PerfState {
  return {
    running: false,
    marks: {},
    rowsMounted: 0,
    frameCount: 0,
    totalFrameMs: 0,
    maxFrameMs: 0,
    longFrames: 0,
  };
}

let state = createState();

export function isRunning(): boolean {
  return state.running;
}

export function startSession(): void {
  state = createState();
  state.running = true;
}

export function endSession(): void {
  state.running = false;
}

export function reset(): void {
  state = createState();
}

export function recordMark(name: string, ms: number): void {
  if (!state.running) return;
  const mark = state.marks[name] ?? { count: 0, totalMs: 0, maxMs: 0 };
  mark.count += 1;
  mark.totalMs += ms;
  mark.maxMs = Math.max(mark.maxMs, ms);
  state.marks[name] = mark;
}

export function recordRowMount(): void {
  if (!state.running) return;
  state.rowsMounted += 1;
}

export function recordFrame(deltaMs: number): void {
  if (!state.running) return;
  state.frameCount += 1;
  state.totalFrameMs += deltaMs;
  state.maxFrameMs = Math.max(state.maxFrameMs, deltaMs);
  if (deltaMs > LONG_FRAME_MS) {
    state.longFrames += 1;
  }
}

/** Dumps the collected metrics to the console as tables. */
export function dump(): void {
  const markRows = Object.entries(state.marks)
    .map(([name, m]) => ({
      mark: name,
      count: m.count,
      avgMs: round(m.totalMs / m.count),
      maxMs: round(m.maxMs),
      totalMs: round(m.totalMs),
    }))
    .sort((a, b) => b.totalMs - a.totalMs);

  const avgFps = state.totalFrameMs > 0 ? round((state.frameCount * 1000) / state.totalFrameMs) : 0;
  const minFps = state.maxFrameMs > 0 ? round(1000 / state.maxFrameMs) : 0;

  const summary = {
    rowsMounted: state.rowsMounted,
    frames: state.frameCount,
    longFrames: state.longFrames,
    avgFps,
    minFps,
    maxFrameMs: round(state.maxFrameMs),
  };

  /* eslint-disable no-console */
  console.group('[cuesheet-perf] benchmark result');
  console.table(summary);
  console.table(markRows);
  console.groupEnd();
  /* eslint-enable no-console */
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
