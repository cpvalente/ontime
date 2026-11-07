import { AxiosError, CanceledError } from 'axios';

import { maybeAxiosError } from '../utils';

describe('maybeAxiosError', () => {
  it('shows the validation message without echoing the submitted value', () => {
    const error = {
      isAxiosError: true,
      response: {
        statusText: 'Unprocessable Entity',
        data: {
          errors: [
            {
              type: 'field',
              value: { title: 'Automation definition', outputs: [{ targetIP: 'not a host' }] },
              msg: 'Invalid OSC target',
              path: '',
              location: 'body',
            },
          ],
        },
      },
    };

    expect(maybeAxiosError(error)).toBe('Unprocessable Entity: Invalid OSC target');
  });

  it('explains a request which could not reach the server', () => {
    expect(maybeAxiosError(new AxiosError('Network Error', AxiosError.ERR_NETWORK))).toBe(
      'Could not reach the Ontime server',
    );
  });

  it('keeps the message of a request which failed before it was sent', () => {
    expect(maybeAxiosError(new AxiosError('Invalid URL', AxiosError.ERR_INVALID_URL))).toBe('Invalid URL');
  });

  it('does not call a request which timed out unreachable', () => {
    expect(maybeAxiosError(new AxiosError('timeout of 1000ms exceeded', AxiosError.ECONNABORTED))).toBe(
      'The Ontime server took too long to respond',
    );
  });

  it('reports a request the browser aborted as unreachable', () => {
    expect(maybeAxiosError(new AxiosError('Request aborted', AxiosError.ECONNABORTED))).toBe(
      'Could not reach the Ontime server',
    );
  });

  it('does not blame the server for a request which was cancelled', () => {
    expect(maybeAxiosError(new CanceledError())).toBe('Request cancelled');
  });
});
