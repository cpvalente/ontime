import { RuntimeStore } from 'ontime-types';

import * as messageService from '../MessageService.js';

describe('MessageService', () => {
  let store: Partial<RuntimeStore>;
  beforeEach(() => {
    // at runtime, the store is instantiated before the message service
    store = {};
    messageService.init(
      (key, value) => (store[key] = value),
      (key) => store[key],
    );
    messageService.clear();
  });

  it('should patch the message state', () => {
    const newState = messageService.patch({
      timer: { text: 'new text', visible: true },
      external: 'external',
    });

    expect(newState).toMatchObject({
      timer: { text: 'new text', visible: true, blackout: false, blink: false, secondarySource: null },
      external: 'external',
    });
  });

  it('should not affect other properties when patching', () => {
    const newState = messageService.patch({
      timer: { text: 'initial text', visible: true },
    });

    expect(newState).toMatchObject({
      timer: { text: 'initial text', visible: true, blackout: false, blink: false, secondarySource: null },
      external: '',
    });
  });
});
