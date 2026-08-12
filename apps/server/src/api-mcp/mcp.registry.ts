/**
 * Tool registry for the Ontime MCP server.
 *
 * This is the only module aware of the low-level `@modelcontextprotocol/sdk` Server API.
 * Tools are declared with `defineTool(name, config, handler)` — the same argument shape
 * `McpServer.registerTool` takes — so migrating to the SDK v2 `registerTool` API means
 * replacing the two functions below with a registration loop, leaving every tool untouched.
 *
 * Responsibilities kept here (and taken over by the SDK on v2):
 * - deriving the advertised JSON Schema from the tool input schema
 * - parsing tool arguments before a handler runs
 *
 * Argument shape is validated here; business rules (does this ID exist, is this custom
 * field known) stay in mcp.service.ts.
 */

import {
  ErrorCode,
  McpError,
  type CallToolResult,
  type ListToolsResult,
  type ToolAnnotations,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

/** Input schemas must describe an object: MCP tool arguments are always a record */
type ToolInput = z.ZodType<Record<string, unknown>, Record<string, unknown>>;

type ToolConfig<Schema extends ToolInput> = {
  description: string;
  annotations: ToolAnnotations;
  /** Tools which take no arguments declare an empty object, so that they too reject unknown keys */
  inputSchema: Schema;
};

export type ToolDefinition = {
  name: string;
  config: ToolConfig<ToolInput>;
  handler: (args: never) => Promise<CallToolResult>;
};

/**
 * Declares a tool, tying the handler argument to the input schema.
 * The generic is what keeps each entry of a heterogeneous tool array individually typed.
 */
export function defineTool<const Schema extends ToolInput>(
  name: string,
  config: ToolConfig<Schema>,
  handler: (args: z.output<Schema>) => Promise<CallToolResult>,
): ToolDefinition {
  return { name, config, handler } as ToolDefinition;
}

/**
 * Converts a tool input schema to the JSON Schema advertised in tools/list.
 *
 * `io: 'input'` is required: schemas which sanitise their values with `.transform()`
 * have an output type the agent must not be shown, and output mode cannot represent them.
 */
function toInputSchema(schema: ToolInput): ListToolsResult['tools'][number]['inputSchema'] {
  // `$schema` is metadata about the document, not part of the tool contract
  const { $schema: _$schema, ...jsonSchema } = z.toJSONSchema(schema, {
    io: 'input',
    target: 'draft-7',
    unrepresentable: 'any',
    reused: 'inline',
  });

  return jsonSchema as ListToolsResult['tools'][number]['inputSchema'];
}

/**
 * Builds the tools/list payload.
 * Call once at module scope: a new Server is created for every MCP request.
 */
export function buildToolList(tools: readonly ToolDefinition[]): ListToolsResult['tools'] {
  return tools.map(({ name, config }) => ({
    name,
    description: config.description,
    annotations: config.annotations,
    inputSchema: toInputSchema(config.inputSchema),
  }));
}

/**
 * Flattens validation issues into a single line an agent can act on, eg.
 * `id: Invalid input: expected string, received undefined; timeStart: ...`
 */
function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join('; ');
}

export function makeToolRegistry(tools: readonly ToolDefinition[]) {
  const byName = new Map(tools.map((tool) => [tool.name, tool]));

  /**
   * Validates the arguments of a tool call and runs its handler.
   *
   * Malformed calls are protocol errors (as they are in the SDK's own registerTool path),
   * while failures from the services are returned as tool errors so that the agent can recover.
   */
  return async function dispatchToolCall(name: string, args: Record<string, unknown>): Promise<CallToolResult> {
    const tool = byName.get(name);
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

    const result = tool.config.inputSchema.safeParse(args);
    if (!result.success) {
      throw new McpError(ErrorCode.InvalidParams, `Invalid arguments for ${name}: ${formatIssues(result.error)}`);
    }

    try {
      return await tool.handler(result.data as never);
    } catch (error) {
      return err(error);
    }
  };
}

// ---- Response helpers ----

const text = (data: unknown): string => JSON.stringify(data);

export const ok = (data: unknown): CallToolResult => ({ content: [{ type: 'text', text: text(data) }] });

export const err = (e: unknown): CallToolResult => ({
  content: [{ type: 'text', text: text({ error: e instanceof Error ? e.message : String(e) }) }],
  isError: true,
});
