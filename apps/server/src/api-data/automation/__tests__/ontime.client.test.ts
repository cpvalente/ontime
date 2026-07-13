import { runtimeStorePlaceholder } from 'ontime-types';

import * as messageService from '../../../services/message-service/message.service.js';
import { toOntimeAction } from '../clients/ontime.client.js';

vi.mock('../../../services/message-service/message.service.js', () => ({
  patch: vi.fn(),
}));

describe('toOntimeAction()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses templates in primary message text', () => {
    toOntimeAction(
      {
        type: 'ontime',
        action: 'message-set',
        text: 'Current: {{timer.current}}',
        visible: true,
      },
      {
        ...runtimeStorePlaceholder,
        timer: {
          ...runtimeStorePlaceholder.timer,
          current: 42,
        },
      },
    );

    expect(messageService.patch).toHaveBeenCalledWith({
      timer: {
        text: 'Current: 42',
        visible: true,
      },
    });
  });

  it('parses templates in secondary message text', () => {
    toOntimeAction(
      {
        type: 'ontime',
        action: 'message-secondary',
        secondarySource: 'secondary',
        text: 'Next: {{eventNext.title}}',
      },
      {
        ...runtimeStorePlaceholder,
        eventNext: {
          id: 'next-event',
          type: 'event',
          cue: '2',
          title: 'Keynote',
          note: '',
          timeStart: 0,
          timeEnd: 0,
          duration: 0,
          timerType: 'count-down',
          colour: '',
          delay: 0,
          isPublic: true,
          skip: false,
          endAction: 'none',
          revision: 0,
          custom: {},
        },
      },
    );

    expect(messageService.patch).toHaveBeenCalledWith({
      timer: {
        secondarySource: 'secondary',
      },
      secondary: 'Next: Keynote',
    });
  });

  it('can set secondary message text without changing the secondary source', () => {
    toOntimeAction(
      {
        type: 'ontime',
        action: 'message-secondary',
        text: 'Next: {{eventNext.title}}',
      },
      {
        ...runtimeStorePlaceholder,
        eventNext: {
          id: 'next-event',
          type: 'event',
          cue: '2',
          title: 'Keynote',
          note: '',
          timeStart: 0,
          timeEnd: 0,
          duration: 0,
          timerType: 'count-down',
          colour: '',
          delay: 0,
          isPublic: true,
          skip: false,
          endAction: 'none',
          revision: 0,
          custom: {},
        },
      },
    );

    expect(messageService.patch).toHaveBeenCalledWith({
      secondary: 'Next: Keynote',
    });
  });
});
