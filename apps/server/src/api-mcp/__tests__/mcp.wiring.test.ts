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

vi.mock('../../classes/data-provider/DataProvider.js', () => ({
  getDataProvider: vi.fn(() => ({ getProjectRundowns: () => ({}) })),
}));

const { PROMPT_DEFINITIONS, handleGetPrompt } = await import('../mcp.prompts.js');
const { RESOURCE_DEFINITIONS, handleReadResource } = await import('../mcp.resources.js');

describe('MCP resource wiring', () => {
  it('serves non-empty content for every listed resource', () => {
    for (const resource of RESOURCE_DEFINITIONS) {
      const result = handleReadResource(resource.uri);
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe(resource.uri);
      expect(result.contents[0].mimeType).toBe(resource.mimeType);
      expect((result.contents[0].text as string).length).toBeGreaterThan(0);
    }
  });

  it('rejects unknown resource URIs', () => {
    expect(() => handleReadResource('ontime://nope')).toThrow('Unknown resource URI: ontime://nope');
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
