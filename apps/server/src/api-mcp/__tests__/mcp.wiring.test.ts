import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api-data/project-data/projectData.dao.js', () => ({
  getProjectData: vi.fn(() => ({ title: 'Test project' })),
}));

vi.mock('../../api-data/rundown/rundown.dao.js', () => ({
  getCurrentRundown: vi.fn(() => ({
    id: 'rundown-1',
    title: 'Test',
    order: [],
    flatOrder: [],
    entries: {},
    revision: 0,
  })),
  getProjectCustomFields: vi.fn(() => ({})),
}));

vi.mock('../../api-data/assets/assets.service.js', () => ({
  readCssFile: vi.fn<() => Promise<string>>(async () => ':root { --color-override: #123456; }'),
  writeCssFile: vi.fn(),
}));

vi.mock('../../api-data/view-settings/viewSettings.dao.js', () => ({
  getViewSettings: vi.fn(() => ({ overrideStyles: false })),
  setOverrideStyles: vi.fn(),
}));

const playbackState = vi.hoisted(() => ({ playback: 'stop' }));
vi.mock('../../stores/runtimeState.js', () => ({ getState: vi.fn(() => ({ timer: playbackState })) }));

vi.mock('../../classes/data-provider/DataProvider.js', () => ({
  getDataProvider: vi.fn(() => ({ getProjectRundowns: () => ({}) })),
}));

const { readCssFile, writeCssFile } = await import('../../api-data/assets/assets.service.js');
const { setOverrideStyles } = await import('../../api-data/view-settings/viewSettings.dao.js');
const { handleToolCall } = await import('../mcp.tools.js');
const { PROMPT_DEFINITIONS, handleGetPrompt } = await import('../mcp.prompts.js');
const { RESOURCE_DEFINITIONS, handleReadResource } = await import('../mcp.resources.js');

describe('MCP resource wiring', () => {
  it('serves non-empty content for every listed resource', async () => {
    for (const resource of RESOURCE_DEFINITIONS) {
      const result = await handleReadResource(resource.uri);
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe(resource.uri);
      expect(result.contents[0].mimeType).toBe(resource.mimeType);
      expect((result.contents[0].text as string).length).toBeGreaterThan(0);
    }
  });

  it('rejects unknown resource URIs', async () => {
    await expect(handleReadResource('ontime://nope')).rejects.toThrow('Unknown resource URI: ontime://nope');
  });

  it('lists the customisation guide and includes the current CSS override', async () => {
    expect(RESOURCE_DEFINITIONS).toContainEqual(expect.objectContaining({ uri: 'ontime://views/customise' }));

    const result = await handleReadResource('ontime://views/customise');
    const text = result.contents[0].text as string;
    expect(text).toContain('--color-override: #123456;');
    expect(text).toContain('--background-color-override: #ececec;');
    expect(text).toContain('It is off');
    expect(text).not.toContain('<!doctype html>');
  });

  it('does not repeat the example CSS when the override is unchanged', async () => {
    const { defaultCss } = await import('../../bundle/bundledCss.js');
    vi.mocked(readCssFile).mockResolvedValueOnce(defaultCss);

    const result = await handleReadResource('ontime://views/customise');
    expect(result.contents[0].text).toContain('Unchanged from the example CSS.');
  });

  it('serves the custom view template separately', async () => {
    const result = await handleReadResource('ontime://views/custom-view-template');
    expect(result.contents[0].text).toContain('<!doctype html>');
  });

  it('serves the customisation guide when the CSS override cannot be read', async () => {
    vi.mocked(readCssFile).mockRejectedValueOnce(new Error('EACCES'));

    const result = await handleReadResource('ontime://views/customise');
    expect(result.contents[0].text).toContain('could not be read');
  });
});

describe('MCP prompt wiring', () => {
  it('resolves every listed prompt', () => {
    for (const prompt of PROMPT_DEFINITIONS) {
      const args = Object.fromEntries((prompt.arguments ?? []).map((arg) => [arg.name, 'test value']));
      const result = handleGetPrompt(prompt.name, args);
      expect(result.messages.length).toBeGreaterThan(0);
      const content = result.messages[0].content;
      expect(content.type).toBe('text');
    }
  });

  it('rejects unknown prompts', () => {
    expect(() => handleGetPrompt('nope', {})).toThrow('Unknown prompt: nope');
  });
});

describe('MCP css override tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    playbackState.playback = 'stop';
  });

  it('writes the css and turns the override on', async () => {
    const result = await handleToolCall('ontime_set_css_override', { css: ':root { --color-override: red; }' });

    expect(result.isError).toBeFalsy();
    expect(writeCssFile).toHaveBeenCalledWith(':root { --color-override: red; }');
    expect(setOverrideStyles).toHaveBeenCalledWith(true);
  });

  it('turns the override off before writing the css', async () => {
    await handleToolCall('ontime_set_css_override', { css: 'a {}', enabled: false });

    expect(setOverrideStyles).toHaveBeenCalledWith(false);
    expect(vi.mocked(setOverrideStyles).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(writeCssFile).mock.invocationCallOrder[0],
    );
  });

  it.each([
    ['a missing css', {}],
    ['an import', { css: '@import "x.css";' }],
    ['a remote url', { css: 'body { background: url("https://example.com/a.png"); }' }],
    ['a protocol relative url', { css: 'body { background: url(//example.com/a.png); }' }],
    ['an escaped url', { css: 'body { background: \\75 rl(https://example.com/a.png); }' }],
    ['an escaped scheme', { css: 'body { background: url("https:\\2f\\2f example.com/a.png"); }' }],
    ['an escaped import', { css: '@\\69mport "x.css";' }],
    ['a commented url', { css: 'body { background: url(/**/"https://example.com/a.png"); }' }],
    ['oversized css', { css: 'a'.repeat(64_001) }],
    ['a non boolean enabled', { css: 'a {}', enabled: 'false' }],
  ])('rejects %s', async (_case, args) => {
    const result = await handleToolCall('ontime_set_css_override', args);

    expect(result.isError).toBe(true);
    expect(writeCssFile).not.toHaveBeenCalled();
  });

  it('accepts local urls and escaped characters', async () => {
    const result = await handleToolCall('ontime_set_css_override', {
      css: '.a { background: url("data:image/png;base64,AAAA"); } .b::before { content: "\\2014"; }',
    });

    expect(result.isError).toBeFalsy();
  });

  it.each(['play', 'armed'])('refuses while playback is %s unless forced', async (playback) => {
    playbackState.playback = playback;

    const refused = await handleToolCall('ontime_set_css_override', { css: 'a {}' });
    expect(refused.isError).toBe(true);
    expect(writeCssFile).not.toHaveBeenCalled();

    await handleToolCall('ontime_set_css_override', { css: 'a {}', force: true });
    expect(writeCssFile).toHaveBeenCalledWith('a {}');
  });
});
