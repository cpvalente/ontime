/**
 * PERF-METRICS — temporary cuesheet scroll-performance scaffold.
 *
 * This whole directory (common/devtools/cuesheet-metrics) is temporary and is meant to be
 * deleted once the first-render optimizations are proven. See the perf investigation plan.
 *
 * Gates all instrumentation: enabled only in a dev build AND when the page is opened with
 * `?perf=1`. Because `isDev` resolves to `import.meta.env.DEV`, this is `false` in production,
 * so every recording path stays runtime-inert there (the guarded code may still be present in
 * the bundle — it is never executed, and the whole scaffold is removed at teardown).
 */
import { isDev } from '../../../externals';

function readPerfParam(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('perf') === '1';
  } catch {
    return false;
  }
}

export const PERF_ENABLED = isDev && readPerfParam();
