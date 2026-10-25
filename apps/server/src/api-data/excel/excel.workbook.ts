import { MILLIS_PER_HOUR } from 'ontime-utils';
import type { WorkBook } from 'xlsx';

const workbookIdleTimeoutMs = MILLIS_PER_HOUR;

let retainedWorkbook: { data: WorkBook; expiry: NodeJS.Timeout } | null = null;

function scheduleExpiry(data: WorkBook): NodeJS.Timeout {
  const expiry = setTimeout(() => {
    if (retainedWorkbook?.data === data) retainedWorkbook = null;
  }, workbookIdleTimeoutMs);
  expiry.unref();
  return expiry;
}

export function retainWorkbook(data: WorkBook): void {
  if (retainedWorkbook) clearTimeout(retainedWorkbook.expiry);
  retainedWorkbook = { data, expiry: scheduleExpiry(data) };
}

export function getWorkbook(): WorkBook | null {
  if (retainedWorkbook) {
    clearTimeout(retainedWorkbook.expiry);
    retainedWorkbook.expiry = scheduleExpiry(retainedWorkbook.data);
  }
  return retainedWorkbook?.data ?? null;
}
