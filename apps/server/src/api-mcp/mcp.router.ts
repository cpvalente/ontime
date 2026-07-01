import type { IncomingMessage, ServerResponse } from 'node:http';

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import type { Request, Response, Router } from 'express';
import { LogOrigin } from 'ontime-types';

import { logger } from '../classes/Logger.js';
import { createMcpServer } from './mcp.server.js';

export const mcpRouter: Router = express.Router();

mcpRouter.post('/', async (req, res) => {
  // A new Server instance is created per request — required for stateless mode where
  // each POST is independent and concurrent requests must not share transport state.
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless: no session tracking
    enableJsonResponse: true,
  });
  const server = createMcpServer();

  let cleanedUp = false;
  const cleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    transport.close();
    await server.close?.();
  };

  res.on('close', () => void cleanup());
  res.on('finish', () => void cleanup());

  try {
    await server.connect(transport);
    await transport.handleRequest(req as IncomingMessage, res as ServerResponse, req.body);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(LogOrigin.Server, `MCP request failed: ${message}`);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message }, id: req.body?.id ?? null });
    }
  } finally {
    await cleanup();
  }
});

// Stateless mode: GET (SSE) and DELETE (session teardown) are not applicable.
// All MCP interactions happen via POST in a single request/response cycle.
const methodNotAllowed = (_req: Request, res: Response) =>
  void res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });

mcpRouter.get('/', methodNotAllowed);
mcpRouter.delete('/', methodNotAllowed);
