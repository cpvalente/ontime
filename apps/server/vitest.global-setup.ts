import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    testDataRoot: string;
  }
}

export function setup(project: TestProject) {
  process.env.TZ = 'Europe/Copenhagen';

  // tests must never share data folders, each test file gets its own folder under this root
  const testDataRoot = mkdtempSync(join(tmpdir(), 'ontime-test-'));
  project.provide('testDataRoot', testDataRoot);

  return () => rmSync(testDataRoot, { recursive: true, force: true });
}
