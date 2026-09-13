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
});
