import * as messageService from '../MessageService.js';

describe('MessageService', () => {
  const publishFunction = () => {};

  beforeAll(() => {
    messageService.init(publishFunction);
  });

  beforeEach(() => {
    messageService.clear();
  });

  it('should patch the message state', () => {
    const message = {
      timer: { text: 'new text', visible: true },
      external: 'external',
    };

    const newState = messageService.patch(message);

    expect(newState).toEqual({
      timer: { text: 'new text', visible: true, blackout: false, blink: false, secondarySource: null },
      external: 'external',
    });
  });

  it('should not affect other properties when patching', () => {
    const initialMessage = {
      timer: { text: 'initial text', visible: true },
    };

    const newState = messageService.patch(initialMessage);

    expect(newState).toEqual({
      timer: { text: 'initial text', visible: true, blackout: false, blink: false, secondarySource: null },
      external: '',
    });
  });
});
