import { describe, expect, it } from 'vitest';

import { TOOLS, TOOL_LIST } from '../mcp.tools.js';

describe('tool wiring', () => {
  it('advertises every declared tool', () => {
    expect(TOOL_LIST).toHaveLength(TOOLS.length);
    expect(TOOL_LIST.map((tool) => tool.name)).toEqual(TOOLS.map((tool) => tool.name));
  });

  it('declares unique tool names', () => {
    const names = TOOLS.map((tool) => tool.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('gives every tool a handler, a description and annotations', () => {
    const incomplete = TOOLS.filter(
      (tool) => typeof tool.handler !== 'function' || !tool.config.description || !tool.config.annotations,
    );
    expect(incomplete.map((tool) => tool.name)).toEqual([]);
  });
});

describe('generated input schemas', () => {
  it('advertises an object schema for every tool', () => {
    const notObjects = TOOL_LIST.filter((tool) => tool.inputSchema.type !== 'object');
    expect(notObjects.map((tool) => tool.name)).toEqual([]);
  });

  /**
   * Recursive schemas would generate $ref/$defs, which some MCP clients handle poorly.
   * Batch creation is deliberately modelled two levels deep to avoid them.
   */
  it('generates self contained schemas, without $ref or $defs', () => {
    const withReferences = TOOL_LIST.filter((tool) => /\$ref|\$defs|\$schema/.test(JSON.stringify(tool.inputSchema)));
    expect(withReferences.map((tool) => tool.name)).toEqual([]);
  });

  it('rejects unknown keys in every tool', () => {
    const permissive = TOOL_LIST.filter((tool) => tool.inputSchema.additionalProperties !== false);
    expect(permissive.map((tool) => tool.name)).toEqual([]);
  });

  it('describes required arguments', () => {
    const byName = new Map(TOOL_LIST.map((tool) => [tool.name, tool.inputSchema]));

    expect(byName.get('ontime_update_entry')?.required).toEqual(['id']);
    expect(byName.get('ontime_delete_entries')?.required).toEqual(['ids']);
    expect(byName.get('ontime_reorder_entry')?.required).toEqual(['entryId', 'destinationId', 'order']);
    expect(byName.get('ontime_batch_update_entries')?.required).toEqual(['ids', 'data']);
    expect(byName.get('ontime_create_custom_field')?.required).toEqual(['label', 'type', 'colour']);
    expect(byName.get('ontime_rename_project')?.required).toEqual(['filename', 'newFilename']);
    // tools which take no arguments advertise an empty object
    expect(byName.get('ontime_list_rundowns')).toEqual({
      type: 'object',
      properties: {},
      additionalProperties: false,
    });
  });

  it('advertises the pre-sanitisation shape of filenames', () => {
    // the agent must be told the shape it should send, not the transformed value
    const schema = TOOL_LIST.find((tool) => tool.name === 'ontime_delete_project')?.inputSchema;
    expect(schema?.properties?.filename).toEqual({
      type: 'string',
      minLength: 1,
      description: 'Project filename to delete (with .json extension)',
    });
  });

  it('generates a stable schema for a representative tool', () => {
    const schema = TOOL_LIST.find((tool) => tool.name === 'ontime_group_entries')?.inputSchema;
    expect(schema).toMatchInlineSnapshot(`
      {
        "additionalProperties": false,
        "properties": {
          "colour": {
            "description": "Hex colour (#RRGGBB) for the group — prefer the default Ontime palette from ontime://style-guide",
            "type": "string",
          },
          "custom": {
            "additionalProperties": {
              "type": "string",
            },
            "description": "Custom field values keyed by existing project field key",
            "propertyNames": {
              "type": "string",
            },
            "type": "object",
          },
          "ids": {
            "description": "Existing top-level entry IDs to group",
            "items": {
              "type": "string",
            },
            "minItems": 1,
            "type": "array",
          },
          "note": {
            "description": "Free-text group note for production notes or references",
            "type": "string",
          },
          "rundownId": {
            "description": "Optional target rundown ID. Omit to target the currently loaded live rundown; provide an ID from ontime_list_rundowns to edit a background rundown without loading it.",
            "type": "string",
          },
          "targetDuration": {
            "description": "Planned length of the group in ms",
            "type": "number",
          },
          "title": {
            "description": "Group title shown in the rundown and views",
            "type": "string",
          },
        },
        "required": [
          "ids",
        ],
        "type": "object",
      }
    `);
  });
});
