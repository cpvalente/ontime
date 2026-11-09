import { Server } from '@modelcontextprotocol/server';
import type { CallToolResult, ListToolsResult } from '@modelcontextprotocol/server';

import { PROMPT_DEFINITIONS, handleGetPrompt } from './mcp.prompts.js';
import { RESOURCE_DEFINITIONS, handleReadResource } from './mcp.resources.js';
import { TOOL_DEFINITIONS, handleToolCall } from './mcp.tools.js';

export function createMcpServer(): Server {
  const server = new Server(
    { name: 'ontime-mcp-server', version: '1.0.0' },
    {
      capabilities: { tools: {}, prompts: {}, resources: {} },
      instructions:
        'Ontime guidance lives in MCP resources. When the user wants to change how screens or views look (colours, fonts, branding, hiding elements) or build a custom view, read ontime://views/customise first; for a custom view, also ontime://views/custom-view-template. For choosing or configuring views, read ontime://views. For rundown structure and colours, read ontime://style-guide.',
    },
  );

  server.setRequestHandler('tools/list', async (): Promise<ListToolsResult> => ({
    tools: TOOL_DEFINITIONS as unknown as ListToolsResult['tools'],
  }));

  server.setRequestHandler('tools/call', async (request): Promise<CallToolResult> => {
    const { name, arguments: args = {} } = request.params;
    return handleToolCall(name, args as Record<string, unknown>);
  });

  server.setRequestHandler('prompts/list', async () => ({ prompts: PROMPT_DEFINITIONS }));

  server.setRequestHandler('prompts/get', async (request) => {
    const { name, arguments: args = {} } = request.params;
    return handleGetPrompt(name, args as Record<string, string>);
  });

  server.setRequestHandler('resources/list', async () => ({ resources: RESOURCE_DEFINITIONS }));

  server.setRequestHandler('resources/read', async (request) => handleReadResource(request.params.uri));

  return server;
}
