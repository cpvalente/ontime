import { setUnderstudy } from '../../services/app-state-service/AppStateService.js';
import { restoreService } from '../../services/restore-service/restore.service.js';
import { consoleError, consoleHighlight, consoleSuccess } from '../../utils/console.js';
import { generateId } from 'ontime-utils';

//------------------------------// As DIRECTOR //------------------------------ //

const understudyCallbacks: ((data: any) => void)[] = [];
const understudys = new Map<
  string,
  {
    callback: null | ((data: any) => void);
  }
>();

export function registerNewUnderstudy(callback: (data: any) => void, id: string) {
  if (!understudys.has(id)) {
    consoleHighlight(`New Understudy connected: ${id}`);
  }
  understudys.set(id, { callback });
}

export function updateUnderstudy(data: any) {
  for (const [id, { callback }] of understudys) {
    if (!callback) {
      consoleError(`Understudy with ID: ${id} is missing`);
      understudys.delete(id);
      continue;
    }
    callback(data);
    understudys.set(id, { callback: null });
  }
}

//------------------------------// As UNDERSTUDY //------------------------------ //

let Director: URL | null = null;
let abortController = new AbortController();
let activePoll = 0;
const id = generateId();

const request: RequestInit = {
  method: 'GET',
  headers: { 'x-ontime-client': 'server' },
  signal: abortController.signal,
};

export function isUnderStudy() {
  return !!activePoll;
}

export async function connectToDirector(host: string): Promise<boolean> {
  const healthCheckUrl = new URL(host);
  healthCheckUrl.pathname += 'health';
  const responds = await fetch(healthCheckUrl, { method: 'GET', headers: { 'x-ontime-client': 'server' } });
  if (!responds.ok) {
    return false;
  }

  await setUnderstudy(host);
  Director = new URL(host);
  Director.pathname += 'data/understudy/poll';
  Director.searchParams.append('id', id);
  activePoll = 3;
  console.log(Director);
  consoleSuccess('Polling Director');
  pollDirector();
  return true;
}

export async function disconnectFromDirector() {
  abortController.abort();
  Director = null;
  await setUnderstudy(null);
}

async function pollDirector() {
  if (!Director) {
    activePoll = 0;
    return;
  }
  const response = await fetch(Director, request);
  switch (response.status) {
    case 200:
      restoreService.save(await response.json());
    //data
    case 408:
    case 504:
      // re-poll
      pollDirector();
      if (activePoll < 3) consoleHighlight('Reconnected to director');
      activePoll = 3;
      break;
    default: {
      console.log(response.statusText);
      // some issue
      activePoll--;
      if (activePoll) {
        consoleError(`Issue with polling director, attempts remaining: ${activePoll}`);
        setTimeout(() => pollDirector(), 500);
      } else {
        consoleError('Issue with polling director, disconnecting');
      }

      break;
    }
  }
}
