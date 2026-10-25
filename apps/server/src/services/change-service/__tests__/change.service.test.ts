import { RefetchKey } from 'ontime-types';

import { sendRefetch } from '../../../adapters/WebsocketAdapter.js';
import { notifyChange } from '../change.service.js';

vi.mock('../../../adapters/WebsocketAdapter.js', () => ({ sendRefetch: vi.fn<typeof sendRefetch>() }));

const flush = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(() => {
  vi.mocked(sendRefetch).mockClear();
});

describe('notifyChange()', () => {
  it('tells clients to refetch at the end of the event loop', async () => {
    notifyChange(RefetchKey.Settings);
    expect(sendRefetch).not.toHaveBeenCalled();

    await flush();
    expect(sendRefetch).toHaveBeenCalledExactlyOnceWith(RefetchKey.Settings, null, undefined);
  });

  it('sends a change made several times in one cycle once, with its latest revision', async () => {
    notifyChange(RefetchKey.Rundown, 3, 'a');
    notifyChange(RefetchKey.Rundown, 5, 'a');
    notifyChange(RefetchKey.Rundown, 4, 'b');
    notifyChange(RefetchKey.CustomFields);
    notifyChange(RefetchKey.CustomFields);
    await flush();

    expect(vi.mocked(sendRefetch).mock.calls).toEqual([
      [RefetchKey.Rundown, 5, 'a'],
      [RefetchKey.Rundown, 4, 'b'],
      [RefetchKey.CustomFields, null, undefined],
    ]);
  });

  it('forces the refetch when any of the merged changes has no revision', async () => {
    notifyChange(RefetchKey.Rundown, 3, 'a');
    notifyChange(RefetchKey.Rundown, null, 'a');
    notifyChange(RefetchKey.Rundown, 7, 'a');
    await flush();

    expect(sendRefetch).toHaveBeenCalledExactlyOnceWith(RefetchKey.Rundown, null, 'a');
  });

  it('sends only a full refetch when one is queued', async () => {
    notifyChange(RefetchKey.Rundown, 3, 'a');
    notifyChange(RefetchKey.All);
    notifyChange(RefetchKey.ProjectRundowns);
    await flush();

    expect(sendRefetch).toHaveBeenCalledExactlyOnceWith(RefetchKey.All);
  });

  it('starts a new batch after sending', async () => {
    notifyChange(RefetchKey.Settings);
    await flush();
    notifyChange(RefetchKey.Settings);
    await flush();

    expect(sendRefetch).toHaveBeenCalledTimes(2);
  });
});
