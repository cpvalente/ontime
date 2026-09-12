import { parseAutomationTriggers, parseOutput } from '../automation.validation.js';

describe('parseAutomationTriggers', () => {
  it('accepts trigger descriptors without an automation ID', () => {
    expect(parseAutomationTriggers([{ title: 'Start', trigger: 'onStart' }])).toEqual([
      { title: 'Start', trigger: 'onStart' },
    ]);
  });

  it('rejects incomplete or unknown trigger descriptors', () => {
    expect(() => parseAutomationTriggers([{ trigger: 'onStart' }])).toThrow();
    expect(() => parseAutomationTriggers([{ title: 'Start', trigger: 'unknown' }])).toThrow();
  });
});

describe('parseOutput', () => {
  describe('handles OSC outputs', () => {
    it('parses a valid payload', () => {
      const payload = {
        type: 'osc',
        targetIP: ' qlab ',
        targetPort: 1234,
        address: '/test',
        args: 'test',
      };
      const result = parseOutput(payload);
      expect(result).toStrictEqual({ ...payload, targetIP: 'qlab' });
    });

    it('throws on a invalid payload', () => {
      const payload = {
        type: 'osc',
        targetIP: 1234,
        targetPort: 1234,
        address: '/test',
        args: 'test',
      };
      expect(() => parseOutput(payload)).toThrow('Unexpected payload type:');
    });

    it('rejects invalid targets and ports', () => {
      expect(() =>
        parseOutput({ type: 'osc', targetIP: 'not a host', targetPort: 53000, address: '/test', args: '' }),
      ).toThrow('Invalid OSC target');
      expect(() =>
        parseOutput({ type: 'osc', targetIP: '127.0.0.1', targetPort: 70000, address: '/test', args: '' }),
      ).toThrow('Invalid OSC port');
      expect(() =>
        parseOutput({ type: 'osc', targetIP: '127.0.0.1', targetPort: 0, address: '/test', args: '' }),
      ).toThrow('Invalid OSC port');
      expect(() =>
        parseOutput({ type: 'osc', targetIP: '::1', targetPort: 53000, address: '/test', args: '' }),
      ).toThrow('Invalid OSC target');
    });

    it('allows runtime templates in a target hostname', () => {
      expect(
        parseOutput({
          type: 'osc',
          targetIP: '{{eventNow.custom.oscTarget}}',
          targetPort: 53000,
          address: '/test',
          args: '',
        }),
      ).toMatchObject({ targetIP: '{{eventNow.custom.oscTarget}}' });
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
      expect(() => parseOutput(payload)).toThrow('Unexpected payload type:');
    });

    it('rejects malformed and unsupported URLs', () => {
      expect(() => parseOutput({ type: 'http', url: 'localhost:3000/hook' })).toThrow('Invalid HTTP URL');
      expect(() => parseOutput({ type: 'http', url: 'ftp://example.com/hook' })).toThrow('Invalid HTTP URL');
    });

    it('allows runtime templates in HTTP URLs', () => {
      expect(parseOutput({ type: 'http', url: 'http://{{eventNow.customFields.webhookHost}}/hook' })).toEqual({
        type: 'http',
        url: 'http://{{eventNow.customFields.webhookHost}}/hook',
      });
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
      expect(() => parseOutput(payload)).toThrow('Invalid Ontime action');
    });

    it('parses message-set', () => {
      expect(
        parseOutput({
          type: 'ontime',
          action: 'message-set',
          text: 'test',
          visible: true,
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
          visible: false,
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
      ).toThrow('Unexpected payload type:');
    });

    it('parses message-secondary', () => {
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

    it('parses message-secondary with a text value', () => {
      expect(
        parseOutput({
          type: 'ontime',
          action: 'message-secondary',
          text: 'hello',
        }),
      ).toMatchObject({
        text: 'hello',
      });
      expect(
        parseOutput({
          type: 'ontime',
          action: 'message-secondary',
          secondarySource: undefined,
          text: 'hello',
        }),
      ).toMatchObject({
        text: 'hello',
      });
      expect(
        parseOutput({
          type: 'ontime',
          action: 'message-secondary',
          secondarySource: 'secondary',
          text: 'hello',
        }),
      ).toMatchObject({
        secondarySource: 'secondary',
        text: 'hello',
      });
      // an empty text is treated as no change
      expect(
        parseOutput({
          type: 'ontime',
          action: 'message-secondary',
          secondarySource: 'secondary',
          text: '',
        }),
      ).toMatchObject({
        secondarySource: 'secondary',
        text: undefined,
      });
      // text can be set while clearing the secondary source
      expect(
        parseOutput({
          type: 'ontime',
          action: 'message-secondary',
          secondarySource: null,
          text: 'hello',
        }),
      ).toMatchObject({
        secondarySource: null,
        text: 'hello',
      });
      expect(() =>
        parseOutput({
          type: 'ontime',
          action: 'message-secondary',
          secondarySource: 'secondary',
          text: 123,
        }),
      ).toThrow('Unexpected payload type:');
    });
  });
});
