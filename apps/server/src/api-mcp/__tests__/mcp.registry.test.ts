import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { buildToolList, defineTool, makeToolRegistry, ok } from '../mcp.registry.js';

const READ = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;

const echo = vi.fn(async (args: unknown) => ok(args));

const tools = [
  defineTool(
    'test_echo',
    {
      description: 'Echoes its arguments',
      inputSchema: z.strictObject({
        id: z.string().describe('An id'),
        count: z.number().optional(),
        filename: z
          .string()
          .optional()
          .transform((filename) => filename?.toUpperCase()),
      }),
      annotations: READ,
    },
    echo,
  ),
  defineTool(
    'test_throws',
    {
      description: 'Always fails',
      inputSchema: z.strictObject({}),
      annotations: READ,
    },
    async () => {
      throw new Error('the rundown is not loaded');
    },
  ),
];

const dispatch = makeToolRegistry(tools);

describe('dispatchToolCall', () => {
  it('passes validated arguments to the handler', async () => {
    const result = await dispatch('test_echo', { id: 'entry-1', count: 2 });
    expect(result.isError).toBeUndefined();
    expect(echo).toHaveBeenCalledWith({ id: 'entry-1', count: 2 });
  });

  it('hands the handler the transformed value, not the raw one', async () => {
    await dispatch('test_echo', { id: 'entry-1', filename: 'show.json' });
    expect(echo).toHaveBeenLastCalledWith({ id: 'entry-1', filename: 'SHOW.JSON' });
  });

  it('rejects malformed arguments as a protocol error, without running the handler', async () => {
    echo.mockClear();
    // this is what the SDK itself does on the registerTool path, and what v2 will do
    await expect(dispatch('test_echo', { count: 'two' })).rejects.toThrow(McpError);
    await expect(dispatch('test_echo', { count: 'two' })).rejects.toMatchObject({ code: ErrorCode.InvalidParams });
    expect(echo).not.toHaveBeenCalled();
  });

  it('names every invalid field in a single message', async () => {
    await expect(dispatch('test_echo', { count: 'two', bogus: true })).rejects.toThrow(
      /Invalid arguments for test_echo:.*id.*count.*bogus/s,
    );
  });

  it('rejects an unknown tool as a protocol error', async () => {
    await expect(dispatch('test_missing', {})).rejects.toMatchObject({
      code: ErrorCode.MethodNotFound,
      message: expect.stringContaining('Unknown tool: test_missing'),
    });
  });

  /**
   * Business failures are returned to the agent rather than thrown, so that it can read the
   * message and recover. Only malformed calls are protocol errors.
   */
  it('returns failures from the services as tool errors', async () => {
    const result = await dispatch('test_throws', {});
    expect(result.isError).toBe(true);
    expect(result.content).toEqual([{ type: 'text', text: '{"error":"the rundown is not loaded"}' }]);
  });
});

describe('buildToolList', () => {
  it('advertises the input shape, before any transform is applied', () => {
    const [echoTool] = buildToolList(tools);
    expect(echoTool.inputSchema).toEqual({
      type: 'object',
      properties: {
        id: { type: 'string', description: 'An id' },
        count: { type: 'number' },
        filename: { type: 'string' },
      },
      required: ['id'],
      additionalProperties: false,
    });
  });

  it('carries the description and annotations through', () => {
    const [echoTool] = buildToolList(tools);
    expect(echoTool.description).toBe('Echoes its arguments');
    expect(echoTool.annotations).toEqual(READ);
  });
});
