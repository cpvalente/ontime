import { describe, expect, it, vi } from 'vitest';

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
}));

vi.mock('../../classes/data-provider/DataProvider.js', () => ({
  getDataProvider: vi.fn(() => ({ getProjectRundowns: () => ({}) })),
}));

const { readCssFile } = await import('../../api-data/assets/assets.service.js');
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
    expect(text).toContain('<!doctype html>');
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
