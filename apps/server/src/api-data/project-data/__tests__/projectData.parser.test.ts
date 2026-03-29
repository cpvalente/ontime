import { parseProjectData } from '../projectData.parser.js';

describe('parseProjectData()', () => {
  it('returns an a base model if nothing is given', () => {
    const errorEmitter = vi.fn();
    const result = parseProjectData({}, errorEmitter);
    expect(result).toBeTypeOf('object');
    expect(errorEmitter).toHaveBeenCalledOnce();
  });

  it('sanitises malformed custom project data', () => {
    const errorEmitter = vi.fn();
    const result = parseProjectData(
      {
        project: {
          title: 'Demo',
          description: '',
          url: '',
          info: '',
          logo: null,
          // @ts-expect-error -- checking malformed data
          custom: '{"networkInterfaces":[{"name":"localhost","address":"127.0.0.1"}]}',
        },
      },
      errorEmitter,
    );

    expect(result.custom).toEqual([]);
    expect(errorEmitter).toHaveBeenCalledWith('Project custom data is invalid, using defaults');
  });
});
