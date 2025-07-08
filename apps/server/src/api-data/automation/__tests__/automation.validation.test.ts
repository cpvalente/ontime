import { parseOutput } from '../automation.validation.js';

describe('parseOutput', () => {
  describe('handles OSC outputs', () => {
    it('parses a valid payload', () => {
      const payload = {
        type: 'osc',
        targetIP: 'localhost',
        targetPort: 1234,
        address: '/test',
        args: 'test',
      };
      const result = parseOutput(payload);
      expect(result).toStrictEqual(payload);
    });

    it('throws on a invalid payload', () => {
      const payload = {
        type: 'osc',
        targetIP: 1234,
        targetPort: 1234,
        address: '/test',
        args: 'test',
      };
      expect(() => parseOutput(payload)).toThrow();
    });
  });
  describe('handles HTTP outputs', () => {
    it('parses a valid payload', () => {
      const payload = {
        type: 'http',
        url: 'http://asdasdas',
      };
      const result = parseOutput(payload);
      expect(result).toStrictEqual(payload);
    });

    it('throws on a invalid payload', () => {
      const payload = {
        type: 'http',
      };
      expect(() => parseOutput(payload)).toThrow();
    });
  });
  describe('handles Ontime outputs', () => {
    it('parses a valid payload', () => {
      const auxStart = {
        type: 'ontime',
        action: 'aux1-start',
      };
      expect(parseOutput(auxStart)).toStrictEqual(auxStart);
      const auxStop = {
        type: 'ontime',
        action: 'aux3-stop',
      };
      expect(parseOutput(auxStop)).toStrictEqual(auxStop);
      const auxPause = {
        type: 'ontime',
        action: 'aux2-pause',
      };
      expect(parseOutput(auxPause)).toStrictEqual(auxPause);
    });

    it('removes extra properties', () => {
      expect(
        parseOutput({
          type: 'ontime',
          action: 'aux1-start',
          time: 10,
        }),
      ).toStrictEqual({
        type: 'ontime',
        action: 'aux1-start',
      });
    });

    it('throws on a invalid payload', () => {
      const payload = {
        type: 'ontime',
        action: 'not-exist',
      };
      expect(() => parseOutput(payload)).toThrow();
    });

    it('parses message-set', () => {
      expect(
        parseOutput({
          type: 'ontime',
          action: 'message-set',
          text: 'test',
          visible: 'true',
        }),
      ).toMatchObject({
        text: 'test',
        visible: true,
      });
      expect(
        parseOutput({
          type: 'ontime',
          action: 'message-set',
          text: '',
          visible: 'false',
        }),
      ).toMatchObject({
        text: undefined,
        visible: false,
      });
      expect(
        parseOutput({
          type: 'ontime',
          action: 'message-set',
          text: '',
          visible: '',
        }),
      ).toMatchObject({
        text: undefined,
        visible: undefined,
      });
      expect(() =>
        parseOutput({
          type: 'ontime',
          action: 'message-set',
          text: 123,
          visible: '',
        }),
      ).toThrow();
    });

    it('parses message-secondary', () => {});
    expect(
      parseOutput({
        type: 'ontime',
        action: 'message-secondary',
        secondarySource: 'test',
      }),
    ).toMatchObject({
      secondarySource: null,
    });
    expect(
      parseOutput({
        type: 'ontime',
        action: 'message-secondary',
        secondarySource: '',
      }),
    ).toMatchObject({
      secondarySource: null,
    });
    expect(
      parseOutput({
        type: 'ontime',
        action: 'message-secondary',
        secondarySource: 'aux1',
      }),
    ).toMatchObject({
      secondarySource: 'aux1',
    });
    expect(
      parseOutput({
        type: 'ontime',
        action: 'message-secondary',
        secondarySource: 'secondary',
      }),
    ).toMatchObject({
      secondarySource: 'secondary',
    });
  });
});
