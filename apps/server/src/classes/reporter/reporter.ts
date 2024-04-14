import { MaybeNumber } from 'ontime-types';

export enum ReportAction {
  Start = 'start',
  Finish = 'finish',
}

const runtimeReport = {};
let startedAt: MaybeNumber = null;
let finishedAt: MaybeNumber = null;

export function add(eventId: string, action: ReportAction) {
  const now = Date.now();
  if (!startedAt === null && action === ReportAction.Start) {
    startedAt = now;
  }
  if (action === ReportAction.Finish) {
    finishedAt = now;
  }

  if (!runtimeReport[eventId]) {
    runtimeReport[eventId] = {};
  }

  runtimeReport[eventId][action] = Date.now();
  console.log('runtimeReport', get());
}

export function get() {
  return { report: runtimeReport, startedAt, finishedAt };
}
