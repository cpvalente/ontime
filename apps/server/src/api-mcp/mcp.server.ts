import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type CallToolResult,
  type ListToolsResult,
} from '@modelcontextprotocol/sdk/types.js';

import { PROMPT_DEFINITIONS, handleGetPrompt } from './mcp.prompts.js';
import { RESOURCE_DEFINITIONS, handleReadResource } from './mcp.resources.js';
import { TOOL_DEFINITIONS, handleToolCall } from './mcp.tools.js';

export function createMcpServer(): Server {
  const server = new Server(
    { name: 'ontime-mcp-server', version: '1.0.0' },
    { capabilities: { tools: {}, prompts: {}, resources: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async (): Promise<ListToolsResult> => ({
    tools: TOOL_DEFINITIONS as unknown as ListToolsResult['tools'],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const { name, arguments: args = {} } = request.params;
    return handleToolCall(name, args as Record<string, unknown>);
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: PROMPT_DEFINITIONS }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    return handleGetPrompt(name, args as Record<string, string>);
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: RESOURCE_DEFINITIONS }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) =>
    handleReadResource(request.params.uri),
  );

  return server;
}
