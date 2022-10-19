import jest from 'jest-mock';
import { DataProvider } from '../DataProvider';

jest.mock('../../../app.js', () => ({
  data: [],
  db: {},
}));

describe('DataProvider', () => {
  describe('safeMerge()', () => {
    it.skip('merges two objects ', () => {
      const oldData = {
        events: [{ event: 'old event' }],
        event: {
          title: 'old title',
          url: 'old url',
          endMessage: 'old end message',
        },
        osc: {
          port: 'old port',
        },
        settings: {
          app: 'ontime',
          version: 1,
          serverPort: 4001,
          lock: null,
          pinCode: null,
          timeFormat: '24',
        },
        userFields: {
          user0: 'old 0',
          user1: 'old 1',
          user2: 'old 2',
          user3: 'old 3',
          user4: 'old 4',
          user5: 'old 5',
          user6: 'old 6',
          user7: 'old 7',
          user8: 'old 8',
          user9: 'old 9',
        },
      };
      const newData = {
        events: [{ event: 'new event' }],
        event: {
          title: 'new title',
          url: 'new url',
          endMessage: 'old end message',
          publicInfo: 'new public info',
        },
        settings: {
          app: 'ontime',
          version: 1,
          serverPort: 4001,
          lock: null,
          pinCode: null,
          timeFormat: '24',
        },
        userFields: {
          user6: 'new 6',
          user7: 'new 7',
          user8: 'new 8',
          user9: 'new 9',
        },
      };

      const expected = {
        events: [{ event: 'new event' }],
        event: {
          title: 'new title',
          url: 'new url',
          publicInfo: 'new public info',
          endMessage: 'old end message',
        },
        osc: {
          port: 'old port',
        },
        settings: {
          app: 'ontime',
          version: 1,
          serverPort: 4001,
          lock: null,
          pinCode: null,
          timeFormat: '24',
        },
        userFields: {
          user0: 'old 0',
          user1: 'old 1',
          user2: 'old 2',
          user3: 'old 3',
          user4: 'old 4',
          user5: 'old 5',
          user6: 'new 6',
          user7: 'new 7',
          user8: 'new 8',
          user9: 'new 9',
        },
      };
      const merged = DataProvider.safeMerge(oldData, newData);
      expect(merged).toStrictEqual(expected);
    });
  });
});
