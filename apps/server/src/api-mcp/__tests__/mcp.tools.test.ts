import { describe, expect, it, vi } from 'vitest';

vi.mock('../../api-data/project-data/projectData.dao.js', () => ({
  editCurrentProjectData: vi.fn(),
  getProjectData: vi.fn(() => ({ title: 'Test project' })),
}));

vi.mock('../../api-data/rundown/rundown.dao.js', () => ({
  getProjectCustomFields: vi.fn(() => ({})),
  getRundownMetadata: vi.fn(() => ({})),
}));

vi.mock('../../api-data/rundown/rundown.service.js', () => ({
  createNewRundown: vi.fn(),
  deleteRundown: vi.fn(),
  duplicateExistingRundown: vi.fn(),
  loadRundown: vi.fn(),
  renameRundown: vi.fn(),
}));

vi.mock('../../classes/data-provider/DataProvider.js', () => ({
  getDataProvider: vi.fn(() => ({ getProjectRundowns: () => ({}) })),
}));

vi.mock('../../models/dataModel.js', () => ({
  makeNewProject: vi.fn(() => ({ project: {} })),
}));

vi.mock('../../services/project-service/ProjectService.js', () => ({
  createProjectWithPatch: vi.fn(),
  deleteProjectFile: vi.fn(),
  duplicateProjectFile: vi.fn(),
  getProjectList: vi.fn(),
  loadProjectFile: vi.fn(),
  renameProjectFile: vi.fn(),
}));

vi.mock('../../stores/runtimeState.js', () => ({
  getState: vi.fn(() => ({})),
}));

vi.mock('../mcp.service.js', () => ({
  batchCreateEntriesForMcp: vi.fn(),
  batchUpdateEntriesForMcp: vi.fn(),
  createCustomFieldForMcp: vi.fn(),
  createEntryForMcp: vi.fn(),
  deleteCustomFieldForMcp: vi.fn(),
  deleteEntriesForMcp: vi.fn(),
  findEntry: vi.fn(),
  getRundownById: vi.fn(() => ({ id: 'r1', order: [], entries: {} })),
  groupEntriesForMcp: vi.fn(),
  reorderEntryForMcp: vi.fn(),
  toRundownList: vi.fn(),
  ungroupEntryForMcp: vi.fn(),
  updateCustomFieldForMcp: vi.fn(),
  updateEntryForMcp: vi.fn(),
}));

const { TOOL_DEFINITIONS, handleToolCall } = await import('../mcp.tools.js');

describe('MCP tool schema generation', () => {
  it('generates a well-formed JSON Schema inputSchema for every tool', () => {
    expect(TOOL_DEFINITIONS.length).toBeGreaterThan(0);
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.inputSchema).toMatchObject({ type: 'object' });
      expect(typeof tool.inputSchema.properties).toBe('object');
    }
  });
});

describe('MCP tool-call argument validation', () => {
  it('rejects a required field missing entirely (previously silently miscast)', async () => {
    const result = await handleToolCall('ontime_create_rundown', {});
    expect(result.isError).toBe(true);
  });

  it('rejects a field with the wrong primitive type', async () => {
    const result = await handleToolCall('ontime_reorder_entry', {
      entryId: 'a',
      destinationId: 'b',
      order: 'sideways', // not one of before/after/insert
    });
    expect(result.isError).toBe(true);
  });

  it('rejects an unknown enum value on a nested field', async () => {
    const result = await handleToolCall('ontime_create_entry', {
      type: 'not-a-real-type',
    });
    expect(result.isError).toBe(true);
  });

  it('accepts a minimal valid payload for a tool with no required fields', async () => {
    const result = await handleToolCall('ontime_get_rundown', {});
    expect(result.isError).toBeFalsy();
  });

  it('reports unknown tool names distinctly from validation failures', async () => {
    const result = await handleToolCall('ontime_does_not_exist', {});
    expect(result.isError).toBe(true);
    expect(result.content[0]).toMatchObject({ type: 'text' });
  });
});
