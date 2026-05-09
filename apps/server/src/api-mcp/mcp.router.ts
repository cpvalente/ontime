import type { IncomingMessage, ServerResponse } from 'node:http';

import express, { type Request, type Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import { createMcpServer } from './mcp.server.js';

export const mcpRouter = express.Router();

mcpRouter.post('/', async (req, res) => {
  // A new Server instance is created per request — required for stateless mode where
  // each POST is independent and concurrent requests must not share transport state.
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless: no session tracking
    enableJsonResponse: true,
  });
  res.on('close', () => transport.close());
  const server = createMcpServer();
  await server.connect(transport);
  await transport.handleRequest(req as IncomingMessage, res as ServerResponse, req.body);
});

// Stateless mode: GET (SSE) and DELETE (session teardown) are not applicable.
// All MCP interactions happen via POST in a single request/response cycle.
const methodNotAllowed = (_req: Request, res: Response) =>
  void res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });

mcpRouter.get('/', methodNotAllowed);
mcpRouter.delete('/', methodNotAllowed);
