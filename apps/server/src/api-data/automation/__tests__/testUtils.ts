import { HTTPOutput, OSCOutput } from 'ontime-types';

export function makeOSCAction(action?: Partial<OSCOutput>): OSCOutput {
  return {
    type: 'osc',
    targetIP: 'localhost',
    targetPort: 3000,
    address: 'test',
    args: 'message',
    ...action,
  };
}

export function makeHTTPAction(action?: Partial<HTTPOutput>): HTTPOutput {
  return {
    type: 'http',
    url: 'localhost',
    ...action,
  };
}
