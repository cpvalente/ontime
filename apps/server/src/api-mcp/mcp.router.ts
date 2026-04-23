import { randomUUID } from 'node:crypto';

import express from 'express';
import { SupportedEntry } from 'ontime-types';

import { getAutomationSettings, addAutomation } from '../api-data/automation/automation.dao.js';
import { editCurrentProjectData, getProjectData } from '../api-data/project-data/projectData.dao.js';
import {
  getCurrentRundown,
  getRundownMetadata,
  getProjectCustomFields,
} from '../api-data/rundown/rundown.dao.js';
import {
  addEntry,
  editEntry,
  deleteEntries,
  reorderEntry,
  loadRundown,
  initRundown,
} from '../api-data/rundown/rundown.service.js';
import { duplicateRundown, normalisedToRundownArray } from '../api-data/rundown/rundown.utils.js';
import { getDataProvider } from '../classes/data-provider/DataProvider.js';
import { makeNewRundown } from '../models/dataModel.js';
import { getState } from '../stores/runtimeState.js';

// MCP SDK imports
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  isInitializeRequest,
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  CallToolResult,
  ListToolsResult,
  ListPromptsResult,
  GetPromptResult,
} from '@modelcontextprotocol/sdk/types.js';

/** Active sessions indexed by session ID */
const sessions = new Map<string, StreamableHTTPServerTransport>();

// ---- Tool definitions ----
const TOOL_DEFINITIONS = [
  {
    name: 'get_rundown',
    description: 'Get the currently loaded rundown including order and entries',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_rundown_metadata',
    description: 'Get cached metadata for the current rundown',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_event',
    description: 'Get a single event by id or cue',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Event ID' },
        cue: { type: 'string', description: 'Event cue' },
      },
    },
  },
  {
    name: 'create_event',
    description: 'Create a new event in the rundown',
    inputSchema: {
      type: 'object',
      required: ['cue', 'title', 'timeStart', 'timeEnd', 'duration'],
      properties: {
        cue: { type: 'string' },
        title: { type: 'string' },
        timeStart: { type: 'number', description: 'Start time in ms from midnight' },
        timeEnd: { type: 'number', description: 'End time in ms from midnight' },
        duration: { type: 'number', description: 'Duration in ms' },
        after: { type: 'string', description: 'Insert after this event ID' },
        before: { type: 'string', description: 'Insert before this event ID' },
        note: { type: 'string' },
        colour: { type: 'string' },
        skip: { type: 'boolean' },
        timerType: { type: 'string', enum: ['count-down', 'count-up', 'time-to-end', 'clock'] },
        endAction: { type: 'string', enum: ['none', 'stop', 'load-next', 'play-next'] },
        linkStart: { type: 'boolean' },
        countToEnd: { type: 'boolean' },
        timeWarning: { type: 'number' },
        timeDanger: { type: 'number' },
      },
    },
  },
  {
    name: 'update_event',
    description: 'Update fields of an existing event',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
        cue: { type: 'string' },
        title: { type: 'string' },
        timeStart: { type: 'number' },
        timeEnd: { type: 'number' },
        duration: { type: 'number' },
        note: { type: 'string' },
        colour: { type: 'string' },
        skip: { type: 'boolean' },
        timerType: { type: 'string', enum: ['count-down', 'count-up', 'time-to-end', 'clock'] },
        endAction: { type: 'string', enum: ['none', 'stop', 'load-next', 'play-next'] },
        linkStart: { type: 'boolean' },
        countToEnd: { type: 'boolean' },
        timeWarning: { type: 'number' },
        timeDanger: { type: 'number' },
      },
    },
  },
  {
    name: 'delete_event',
    description: 'Delete one or more events from the rundown',
    inputSchema: {
      type: 'object',
      required: ['ids'],
      properties: {
        ids: { type: 'array', items: { type: 'string' }, description: 'Array of event IDs to delete' },
      },
    },
  },
  {
    name: 'reorder_event',
    description: 'Move an event to a new position relative to another event',
    inputSchema: {
      type: 'object',
      required: ['entryId', 'destinationId', 'order'],
      properties: {
        entryId: { type: 'string', description: 'ID of the event to move' },
        destinationId: { type: 'string', description: 'ID of the destination event' },
        order: { type: 'string', enum: ['before', 'after', 'insert'], description: 'Position relative to destination' },
      },
    },
  },
  {
    name: 'list_rundowns',
    description: 'List all available rundowns',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'create_rundown',
    description: 'Create a new rundown',
    inputSchema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string', description: 'Title for the new rundown' },
      },
    },
  },
  {
    name: 'load_rundown',
    description: 'Load a rundown, making it the active rundown',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'Rundown ID to load' },
      },
    },
  },
  {
    name: 'rename_rundown',
    description: 'Rename an existing rundown',
    inputSchema: {
      type: 'object',
      required: ['id', 'title'],
      properties: {
        id: { type: 'string', description: 'Rundown ID to rename' },
        title: { type: 'string', description: 'New title' },
      },
    },
  },
  {
    name: 'delete_rundown',
    description: 'Delete a rundown (cannot delete the currently loaded rundown or the last remaining rundown)',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'Rundown ID to delete' },
      },
    },
  },
  {
    name: 'duplicate_rundown',
    description: 'Duplicate a rundown',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'Rundown ID to duplicate' },
      },
    },
  },
  {
    name: 'get_timer_state',
    description: 'Get the current timer/playback state',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_project_info',
    description: 'Get current project information',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'update_project_info',
    description: 'Update project information fields',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        publicUrl: { type: 'string' },
        publicInfo: { type: 'string' },
      },
    },
  },
  {
    name: 'list_automations',
    description: 'List all automations and triggers',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'create_automation',
    description: 'Create a new automation',
    inputSchema: {
      type: 'object',
      required: ['title', 'filterRule', 'filters', 'outputs'],
      properties: {
        title: { type: 'string' },
        filterRule: { type: 'string', enum: ['all', 'any'] },
        filters: { type: 'array', items: { type: 'object' }, description: 'Array of filter objects' },
        outputs: { type: 'array', items: { type: 'object' }, description: 'Array of output action objects' },
      },
    },
  },
  {
    name: 'get_custom_fields',
    description: 'Get the project custom fields',
    inputSchema: { type: 'object', properties: {} },
  },
] as const;

// ---- Helper to build rundown list response ----
function rundownListResponse() {
  const loaded = getCurrentRundown().id;
  const rundowns = normalisedToRundownArray(getDataProvider().getProjectRundowns());
  return { loaded, rundowns };
}

// ---- Tool handlers ----
async function handleToolCall(name: string, args: Record<string, unknown>): Promise<CallToolResult> {
  const text = (data: unknown) => JSON.stringify(data);
  const ok = (data: unknown): CallToolResult => ({ content: [{ type: 'text', text: text(data) }] });
  const err = (e: unknown): CallToolResult => ({ content: [{ type: 'text', text: text({ error: String(e) }) }], isError: true });

  switch (name) {
    case 'get_rundown': {
      const rundown = getCurrentRundown();
      return ok({ order: rundown.order, entries: rundown.entries });
    }

    case 'get_rundown_metadata': {
      return ok(getRundownMetadata());
    }

    case 'get_event': {
      const rundown = getCurrentRundown();
      const id = args.id as string | undefined;
      const cue = args.cue as string | undefined;
      if (id) {
        const entry = rundown.entries[id];
        if (!entry) return err(`No event with id ${id}`);
        return ok(entry);
      }
      if (cue) {
        const entry = Object.values(rundown.entries).find((e) => 'cue' in e && (e as { cue: string }).cue === cue);
        if (!entry) return err(`No event with cue ${cue}`);
        return ok(entry);
      }
      return err('Provide id or cue');
    }

    case 'create_event': {
      try {
        const entry = await addEntry({ type: SupportedEntry.Event, ...args } as never);
        return ok(entry);
      } catch (e) {
        return err(e);
      }
    }

    case 'update_event': {
      try {
        const entry = await editEntry(args as never);
        return ok(entry);
      } catch (e) {
        return err(e);
      }
    }

    case 'delete_event': {
      try {
        const ids = args.ids as string[];
        const rundown = await deleteEntries(ids);
        return ok({ deleted: ids, order: rundown.order });
      } catch (e) {
        return err(e);
      }
    }

    case 'reorder_event': {
      try {
        const { entryId, destinationId, order } = args as { entryId: string; destinationId: string; order: 'before' | 'after' | 'insert' };
        const rundown = await reorderEntry(entryId, destinationId, order);
        return ok({ order: rundown.order });
      } catch (e) {
        return err(e);
      }
    }

    case 'list_rundowns': {
      return ok(rundownListResponse());
    }

    case 'create_rundown': {
      try {
        const rundown = makeNewRundown();
        rundown.title = args.title as string;
        await getDataProvider().setRundown(rundown.id, rundown);
        return ok(rundownListResponse());
      } catch (e) {
        return err(e);
      }
    }

    case 'load_rundown': {
      try {
        await loadRundown(args.id as string);
        return ok(rundownListResponse());
      } catch (e) {
        return err(e);
      }
    }

    case 'rename_rundown': {
      try {
        const { id, title } = args as { id: string; title: string };
        const dataProvider = getDataProvider();
        const rundown = dataProvider.getRundown(id);
        if (!rundown) throw new Error(`Rundown ${id} not found`);
        await dataProvider.setRundown(id, { ...rundown, title });
        if (id === getCurrentRundown().id) {
          await initRundown(dataProvider.getRundown(id), dataProvider.getCustomFields());
        }
        return ok(rundownListResponse());
      } catch (e) {
        return err(e);
      }
    }

    case 'delete_rundown': {
      try {
        const id = args.id as string;
        const dataProvider = getDataProvider();
        const currentId = getCurrentRundown().id;
        if (id === currentId) {
          return err('Cannot delete the currently loaded rundown');
        }
        const rundowns = dataProvider.getProjectRundowns();
        if (Object.keys(rundowns).length <= 1) {
          return err('Cannot delete the last rundown');
        }
        await dataProvider.deleteRundown(id);
        return ok(rundownListResponse());
      } catch (e) {
        return err(e);
      }
    }

    case 'duplicate_rundown': {
      try {
        const id = args.id as string;
        const dataProvider = getDataProvider();
        const rundown = dataProvider.getRundown(id);
        const copy = duplicateRundown(rundown as never, `Copy of ${rundown.title}`);
        await dataProvider.setRundown(copy.id, copy);
        return ok(rundownListResponse());
      } catch (e) {
        return err(e);
      }
    }

    case 'get_timer_state': {
      const state = getState();
      return ok({
        clock: state.clock,
        timer: state.timer,
        eventNow: state.eventNow,
        eventNext: state.eventNext,
        offset: state.offset,
      });
    }

    case 'get_project_info': {
      return ok(getProjectData());
    }

    case 'update_project_info': {
      try {
        const updated = await editCurrentProjectData(args as never);
        return ok(updated);
      } catch (e) {
        return err(e);
      }
    }

    case 'list_automations': {
      const settings = getAutomationSettings();
      return ok({
        enabledAutomations: settings.enabledAutomations,
        triggers: settings.triggers,
        automations: settings.automations,
      });
    }

    case 'create_automation': {
      try {
        const result = await addAutomation(args as never);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }

    case 'get_custom_fields': {
      return ok(getProjectCustomFields());
    }

    default:
      return err(`Unknown tool: ${name}`);
  }
}

/** Build and configure a new MCP Server instance */
function createMcpServer(): Server {
  const server = new Server(
    { name: 'ontime', version: '1.0.0' },
    {
      capabilities: {
        tools: {},
        prompts: {},
      },
    },
  );

  // Handle tools/list
  server.setRequestHandler(ListToolsRequestSchema, async (): Promise<ListToolsResult> => {
    return { tools: TOOL_DEFINITIONS as unknown as ListToolsResult['tools'] };
  });

  // Handle tools/call
  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const { name, arguments: args = {} } = request.params;
    return handleToolCall(name, args as Record<string, unknown>);
  });

  // Handle prompts/list
  server.setRequestHandler(ListPromptsRequestSchema, async (): Promise<ListPromptsResult> => {
    return {
      prompts: [
        {
          name: 'create_rundown_from_agenda',
          description: 'Generate MCP tool calls to build a rundown from a plain-text agenda',
          arguments: [
            {
              name: 'agenda',
              description: 'Plain-text agenda to convert into an Ontime rundown',
              required: true,
            },
          ],
        },
      ],
    };
  });

  // Handle prompts/get
  server.setRequestHandler(GetPromptRequestSchema, async (request): Promise<GetPromptResult> => {
    const { name, arguments: args = {} } = request.params;
    if (name !== 'create_rundown_from_agenda') {
      throw new Error(`Unknown prompt: ${name}`);
    }
    const agenda = (args as Record<string, string>).agenda ?? '';
    return {
      description: 'Generate MCP tool calls to build a rundown from a plain-text agenda',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Convert the following agenda into an Ontime rundown using these rules:

- Times are in milliseconds from midnight. 09:00 = 32400000, 10:30 = 37800000, etc.
- duration = timeEnd - timeStart
- Cue prefixes by type: K01/K02/... for keynotes, P01/P02/... for panels, B01/B02/... for breaks
- Colours by type: #4A90D9 for keynotes, #7B68EE for panels, #888888 for breaks, #E8A838 for meals
- First call get_rundown to see the current state, then use create_event for each agenda item
- Pass \`after: <previous event id>\` to chain events in sequence

Agenda:
${agenda}`,
          },
        },
      ],
    };
  });

  return server;
}

/** Express router for the MCP endpoint */
export const mcpRouter = express.Router();

// POST / — handle new or existing session
mcpRouter.post('/', async (req, res) => {
  const body = req.body as unknown;
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (isInitializeRequest(body)) {
    // New session: pin the session ID so the map key matches what the transport
    // sends back to the client in the mcp-session-id response header.
    const sessionId = randomUUID();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => sessionId,
    });

    sessions.set(sessionId, transport);
    transport.onclose = () => sessions.delete(sessionId);

    const mcpServer = createMcpServer();
    await mcpServer.connect(transport);
    await transport.handleRequest(req as never, res as never, body);
    return;
  }

  // Existing session
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ error: 'Invalid or missing mcp-session-id' });
    return;
  }

  const transport = sessions.get(sessionId)!;
  await transport.handleRequest(req as never, res as never, body);
});

// GET / — SSE stream for existing session
mcpRouter.get('/', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ error: 'Invalid or missing mcp-session-id' });
    return;
  }

  const transport = sessions.get(sessionId)!;
  await transport.handleRequest(req as never, res as never);
});

// DELETE / — close and remove session
mcpRouter.delete('/', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ error: 'Invalid or missing mcp-session-id' });
    return;
  }

  const transport = sessions.get(sessionId)!;
  sessions.delete(sessionId);
  await transport.close();
  res.status(204).send();
});
