import { DatabaseModel, URLPreset } from 'ontime-types';

import { parseUrlPresets } from '../urlPresets.parser.js';

describe('parseUrlPresets()', () => {
  it('returns an a base model if nothing is given', () => {
    const errorEmitter = vi.fn();
    const result = parseUrlPresets({}, errorEmitter);
    expect(result).toBeTypeOf('object');
    expect(errorEmitter).toHaveBeenCalledOnce();
  });

  it('parses data, skipping invalid results', () => {
    const errorEmitter = vi.fn();
    const urlPresets = [{ enabled: true, alias: 'alias', pathAndParams: 'ss' }] as URLPreset[];
    const result = parseUrlPresets({ urlPresets }, errorEmitter);
    expect(result.length).toEqual(1);
    expect(result.at(0)).toMatchObject({
      enabled: true,
      alias: 'alias',
      pathAndParams: 'ss',
    });
    expect(errorEmitter).not.toHaveBeenCalled();
  });

  it('imports a well defined urlPreset', () => {
    const testData = {
      rundown: [],
      settings: {
        version: '2.0.0',
      },
      urlPresets: [
        {
          enabled: false,
          alias: 'testalias',
          pathAndParams: 'testpathAndParams',
        },
      ],
    } as unknown as DatabaseModel;

    const parsed = parseUrlPresets(testData);
    expect(parsed.length).toBe(1);

    // generates missing id
    expect(parsed[0].alias).toBeDefined();
  });
});
