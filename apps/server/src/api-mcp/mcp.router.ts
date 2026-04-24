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
  batchEditEntries,
} from '../api-data/rundown/rundown.service.js';
import { duplicateRundown, normalisedToRundownArray } from '../api-data/rundown/rundown.utils.js';
import { getDataProvider } from '../classes/data-provider/DataProvider.js';
import { makeNewRundown } from '../models/dataModel.js';
import {
  getProjectList,
  loadProjectFile,
  createProjectWithPatch,
  renameProjectFile,
  duplicateProjectFile,
  deleteProjectFile,
} from '../services/project-service/ProjectService.js';
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
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  CallToolResult,
  ListToolsResult,
  ListPromptsResult,
  GetPromptResult,
  ListResourcesResult,
  ReadResourceResult,
} from '@modelcontextprotocol/sdk/types.js';

/** Active sessions indexed by session ID */
const sessions = new Map<string, StreamableHTTPServerTransport>();

// ---- Static schema document exposed as a resource ----
const ONTIME_SCHEMA_MARKDOWN = `# Ontime data model

A concise reference for how Ontime structures rundowns, events, and related data. Read this once per session to ground your answers in Ontime's semantics.

## Rundown

A rundown is an ordered list of entries rendered as a show schedule. A project can contain multiple rundowns; one is "loaded" at a time.

\`\`\`
Rundown {
  id: string
  title: string
  order: EntryId[]       // top-level entry order
  flatOrder: EntryId[]   // includes entries nested in groups
  entries: { [id: EntryId]: OntimeEntry }
  revision: number
}
\`\`\`

## Entries

There are three entry types discriminated by \`type\`:

### \`event\` — OntimeEvent (a timed show item)
\`\`\`
{
  type: 'event'
  id: EntryId
  cue: string                // human-facing cue label, e.g. "K01"
  title: string
  note: string
  colour: string             // hex, e.g. "#4A90D9"
  timeStart: number          // ms from midnight (09:00 = 32400000)
  timeEnd: number            // ms from midnight
  duration: number           // ms (= timeEnd - timeStart)
  delay: number              // accumulated delay in ms
  timerType: 'count-down' | 'count-up' | 'time-to-end' | 'clock'
  endAction: 'none' | 'stop' | 'load-next' | 'play-next'
  linkStart: boolean         // chain start to previous event's end
  countToEnd: boolean        // timer counts to planned end time
  skip: boolean              // event is skipped during playback
  timeWarning: number        // ms before end to trigger 'warning' state
  timeDanger: number         // ms before end to trigger 'danger' state
  custom: { [key: string]: string }   // custom field values
  triggers: AutomationTrigger[]
}
\`\`\`

### \`delay\` — Delay (schedule shift applied to following events)
\`\`\`
{ type: 'delay', id, duration: number }
\`\`\`

### \`group\` — Group (nested container of entries)
\`\`\`
{ type: 'group', id, title, colour, note, entries: EntryId[], targetDuration?: number }
\`\`\`

## Time format
All time fields are **milliseconds from midnight (local)**. Examples:
- 09:00:00 = 32400000
- 09:30:00 = 34200000
- 14:15:00 = 51300000
- duration of 45 min = 2700000

## Cue conventions (not enforced — useful when generating)
- Keynotes: K01, K02, …
- Panels: P01, P02, …
- Breaks: B01, B02, …
- Meals: M01, M02, …

## Colours (common Ontime palette)
- Keynotes: #4A90D9
- Panels: #7B68EE
- Breaks: #888888
- Meals: #E8A838

## Custom fields
Custom fields are project-scoped name/type/colour definitions stored at \`ontime://project/custom-fields\`. Each event stores values at \`event.custom[fieldKey]\`.

## Playback states (runtime only)
\`'stop' | 'play' | 'pause' | 'armed' | 'roll'\`. When playback is not \`stop\`, mutating tools warn that changes are visible immediately.

## Useful resource URIs
- \`ontime://schema\` — this document
- \`ontime://rundown/current\` — the currently loaded rundown (JSON)
- \`ontime://rundowns\` — all rundowns in the project (JSON)
- \`ontime://project/info\` — project metadata (JSON)
- \`ontime://project/custom-fields\` — custom field definitions (JSON)
`;

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
    description:
      'Create a new automation (trigger + filter + outputs). Ontime provides a test button in the Automations panel — encourage the user to preview the output before relying on it in a live show.',
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
  // --- Batch rundown edits ---
  {
    name: 'create_events_batch',
    description:
      'Create multiple events in one call. Use this for "build from agenda" flows to avoid many round trips. Events are inserted in array order; if `after` is provided it positions the first event, subsequent events chain from the previous.',
    inputSchema: {
      type: 'object',
      required: ['events'],
      properties: {
        after: { type: 'string', description: 'Insert the first event after this entry ID' },
        events: {
          type: 'array',
          description: 'Array of events to create, in desired order',
          items: {
            type: 'object',
            required: ['cue', 'title', 'timeStart', 'timeEnd', 'duration'],
            properties: {
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
      },
    },
  },
  {
    name: 'batch_update_events',
    description:
      'Apply the same field changes to multiple events by ID. Use for bulk operations like recolouring all keynotes or shifting times by a constant offset (compute new times client-side first).',
    inputSchema: {
      type: 'object',
      required: ['ids', 'data'],
      properties: {
        ids: { type: 'array', items: { type: 'string' }, description: 'Array of event IDs to update' },
        data: {
          type: 'object',
          description: 'Partial event fields to apply to every ID',
          properties: {
            cue: { type: 'string' },
            title: { type: 'string' },
            note: { type: 'string' },
            colour: { type: 'string' },
            skip: { type: 'boolean' },
            timerType: { type: 'string', enum: ['count-down', 'count-up', 'time-to-end', 'clock'] },
            endAction: { type: 'string', enum: ['none', 'stop', 'load-next', 'play-next'] },
            timeWarning: { type: 'number' },
            timeDanger: { type: 'number' },
          },
        },
      },
    },
  },
  // --- Project file management ---
  {
    name: 'list_projects',
    description: 'List all project files on disk. Returns filenames, timestamps, and the last-loaded project name.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'load_project',
    description:
      'Load a different project file by filename. This stops playback, swaps the database, and reinitialises runtime. Prefer to use when playback is stopped.',
    inputSchema: {
      type: 'object',
      required: ['filename'],
      properties: {
        filename: { type: 'string', description: 'Project filename, e.g. "my-show.json"' },
      },
    },
  },
  {
    name: 'create_project',
    description: 'Create a new empty project file and save it to disk. Does not switch to the new project.',
    inputSchema: {
      type: 'object',
      required: ['filename'],
      properties: {
        filename: { type: 'string', description: 'Filename for the new project (e.g. "my-show")' },
        title: { type: 'string', description: 'Optional project title' },
        description: { type: 'string', description: 'Optional project description' },
      },
    },
  },
  {
    name: 'rename_project',
    description: 'Rename a project file. If the renamed project is currently loaded, it is reloaded with the new name.',
    inputSchema: {
      type: 'object',
      required: ['filename', 'newFilename'],
      properties: {
        filename: { type: 'string', description: 'Current filename' },
        newFilename: { type: 'string', description: 'New filename' },
      },
    },
  },
  {
    name: 'duplicate_project',
    description: 'Duplicate a project file on disk with a new filename.',
    inputSchema: {
      type: 'object',
      required: ['filename', 'newFilename'],
      properties: {
        filename: { type: 'string', description: 'Source filename to copy' },
        newFilename: { type: 'string', description: 'Filename of the new copy' },
      },
    },
  },
  {
    name: 'delete_project',
    description: 'Delete a project file from disk. Fails if the file is currently loaded.',
    inputSchema: {
      type: 'object',
      required: ['filename'],
      properties: {
        filename: { type: 'string', description: 'Project filename to delete' },
      },
    },
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
  // Wraps mutating-tool results with a warning when playback is active so the agent can relay it to the user.
  const okMutation = (data: unknown): CallToolResult => {
    const playback = getState().timer.playback;
    const payload =
      playback !== 'stop'
        ? { warning: 'Playback is running — this change takes effect immediately.', result: data }
        : data;
    return { content: [{ type: 'text', text: text(payload) }] };
  };

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
        return okMutation(entry);
      } catch (e) {
        return err(e);
      }
    }

    case 'update_event': {
      try {
        const entry = await editEntry(args as never);
        return okMutation(entry);
      } catch (e) {
        return err(e);
      }
    }

    case 'delete_event': {
      try {
        const ids = args.ids as string[];
        const rundown = await deleteEntries(ids);
        return okMutation({ deleted: ids, order: rundown.order });
      } catch (e) {
        return err(e);
      }
    }

    case 'reorder_event': {
      try {
        const { entryId, destinationId, order } = args as { entryId: string; destinationId: string; order: 'before' | 'after' | 'insert' };
        const rundown = await reorderEntry(entryId, destinationId, order);
        return okMutation({ order: rundown.order });
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
        return okMutation(rundownListResponse());
      } catch (e) {
        return err(e);
      }
    }

    case 'load_rundown': {
      try {
        await loadRundown(args.id as string);
        return okMutation(rundownListResponse());
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
        return okMutation(rundownListResponse());
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
        return okMutation(rundownListResponse());
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
        return okMutation(rundownListResponse());
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
        return okMutation(result);
      } catch (e) {
        return err(e);
      }
    }

    case 'get_custom_fields': {
      return ok(getProjectCustomFields());
    }

    // --- Batch rundown edits ---

    case 'create_events_batch': {
      try {
        const events = (args.events as Array<Record<string, unknown>>) ?? [];
        let previousId = (args.after as string | undefined) ?? undefined;
        const created: unknown[] = [];
        for (const eventArgs of events) {
          const entry = await addEntry({
            type: SupportedEntry.Event,
            ...eventArgs,
            ...(previousId ? { after: previousId } : {}),
          } as never);
          created.push(entry);
          previousId = (entry as { id: string }).id;
        }
        return okMutation({ created });
      } catch (e) {
        return err(e);
      }
    }

    case 'batch_update_events': {
      try {
        const ids = args.ids as string[];
        const data = args.data as Partial<Record<string, unknown>>;
        const rundown = await batchEditEntries(ids, data as never);
        return okMutation({ updated: ids, order: rundown.order });
      } catch (e) {
        return err(e);
      }
    }

    // --- Project file management ---

    case 'list_projects': {
      return ok(await getProjectList());
    }

    case 'load_project': {
      try {
        await loadProjectFile(args.filename as string);
        return okMutation(await getProjectList());
      } catch (e) {
        return err(e);
      }
    }

    case 'create_project': {
      try {
        const { filename, title, description } = args as {
          filename: string;
          title?: string;
          description?: string;
        };
        const patch =
          title || description
            ? { project: { title: title ?? '', description: description ?? '' } as never }
            : {};
        const newFileName = await createProjectWithPatch(filename, patch);
        return ok({ filename: newFileName });
      } catch (e) {
        return err(e);
      }
    }

    case 'rename_project': {
      try {
        const { filename, newFilename } = args as { filename: string; newFilename: string };
        await renameProjectFile(filename, newFilename);
        return ok(await getProjectList());
      } catch (e) {
        return err(e);
      }
    }

    case 'duplicate_project': {
      try {
        const { filename, newFilename } = args as { filename: string; newFilename: string };
        await duplicateProjectFile(filename, newFilename);
        return ok(await getProjectList());
      } catch (e) {
        return err(e);
      }
    }

    case 'delete_project': {
      try {
        await deleteProjectFile(args.filename as string);
        return ok(await getProjectList());
      } catch (e) {
        return err(e);
      }
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
        resources: {},
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
          description: 'Build an Ontime rundown from a plain-text agenda',
          arguments: [
            {
              name: 'agenda',
              description: 'Plain-text agenda to convert into an Ontime rundown',
              required: true,
            },
          ],
        },
        {
          name: 'bulk_edit_rundown',
          description: 'Apply a bulk change across the rundown (shift times, recolour, skip, etc.)',
          arguments: [
            {
              name: 'instruction',
              description: 'What to change (e.g. "shift everything 30 minutes later", "make all breaks 10 minutes")',
              required: true,
            },
          ],
        },
        {
          name: 'validate_rundown',
          description: 'Check the current rundown for common issues before a show',
          arguments: [],
        },
        {
          name: 'restructure_rundown',
          description: 'Reorder or group events in the rundown',
          arguments: [
            {
              name: 'instruction',
              description: 'What to restructure (e.g. "group all keynotes together", "reorder to match this template")',
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
    const a = args as Record<string, string>;

    if (name === 'create_rundown_from_agenda') {
      const agenda = a.agenda ?? '';
      return {
        description: 'Build an Ontime rundown from a plain-text agenda',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Convert the following agenda into an Ontime rundown.

Data model:
- Times are milliseconds from midnight. 09:00 = 32400000, 10:30 = 37800000, etc.
- duration = timeEnd - timeStart
- Cue prefixes by type: K01/K02/... for keynotes, P01/P02/... for panels, B01/B02/... for breaks, M01/... for meals
- Colours by type: #4A90D9 keynotes, #7B68EE panels, #888888 breaks, #E8A838 meals
- timerType: "count-down" for timed sessions, "clock" for clock-relative
- endAction: "load-next" for back-to-back sessions, "none" otherwise

Steps:
1. Call get_rundown to see current state and identify an \`after\` anchor if appending.
2. Build an array of events in order and call create_events_batch ONCE with all of them. This is much faster than calling create_event per item.
3. If the rundown already has events, pass \`after: <last event id>\` on the batch call so new events chain from the end.

Agenda:
${agenda}`,
            },
          },
        ],
      };
    }

    if (name === 'bulk_edit_rundown') {
      const instruction = a.instruction ?? '';
      return {
        description: 'Apply a bulk change across the rundown',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Apply the following bulk edit to the current Ontime rundown: "${instruction}"

Strategy:
1. Call get_rundown to see the current events, their IDs, and field values.
2. Determine which event IDs are affected by the instruction.
3. If every affected event receives the SAME field changes (e.g. "colour all keynotes purple", "skip all breaks"): call batch_update_events once with { ids, data }.
4. If each event needs DIFFERENT values (e.g. "shift everything 30 minutes" — each event gets a different timeStart/timeEnd): compute the new values per event, then call update_event for each, or call batch_update_events multiple times grouped by shared data.
5. Time fields are milliseconds from midnight; compute arithmetic before calling the tools.

Confirm with the user before making destructive changes like setting skip=true on many events.`,
            },
          },
        ],
      };
    }

    if (name === 'validate_rundown') {
      return {
        description: 'Check the current rundown for common issues',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Validate the currently loaded Ontime rundown and report issues.

Steps:
1. Call get_rundown to read all events.
2. Call get_rundown_metadata for totals (total duration, first/last times, flagged IDs).
3. Check and report:
   - Events with missing or duplicate \`cue\`
   - Events with missing \`title\`
   - Events with \`duration\` of 0 or negative
   - Events where \`timeEnd\` is before \`timeStart\`
   - Events whose \`timeStart\` overlaps the previous event's \`timeEnd\` (schedule conflict)
   - Large unexplained gaps between consecutive events (> 30 min) that may indicate missing breaks
   - Events flagged \`skip: true\` — confirm with the user these are intentional
   - Total rundown duration and whether it matches the user's expected show length (ask if unknown)

Present issues grouped by severity: ERROR (breaks playback), WARNING (likely mistake), INFO (worth confirming).`,
            },
          },
        ],
      };
    }

    if (name === 'restructure_rundown') {
      const instruction = a.instruction ?? '';
      return {
        description: 'Reorder events in the rundown',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Restructure the current Ontime rundown: "${instruction}"

Steps:
1. Call get_rundown to see the current order and event fields.
2. Compute the target order as an array of event IDs.
3. For each event that needs to move, call reorder_event with { entryId, destinationId, order: 'before' | 'after' }.
4. Call get_rundown again at the end to confirm the new order.

Tip: moving items in the "to" direction of the target position minimises reorder calls. Plan the sequence of moves to avoid moving the same event twice.`,
            },
          },
        ],
      };
    }

    throw new Error(`Unknown prompt: ${name}`);
  });

  // Handle resources/list — static list of readable resources the agent can load into context
  server.setRequestHandler(ListResourcesRequestSchema, async (): Promise<ListResourcesResult> => {
    return {
      resources: [
        {
          uri: 'ontime://schema',
          name: 'ontime-schema',
          title: 'Ontime data model reference',
          description:
            'Markdown reference for how Ontime structures rundowns, events, delays, groups, time fields, cue conventions, and colours. Read once per session to ground your answers.',
          mimeType: 'text/markdown',
        },
        {
          uri: 'ontime://rundown/current',
          name: 'current-rundown',
          title: 'Currently loaded rundown',
          description:
            'The rundown currently active in Ontime, with its full entries map and order. Re-read after any mutating call to see updated state.',
          mimeType: 'application/json',
        },
        {
          uri: 'ontime://rundowns',
          name: 'project-rundowns',
          title: 'All rundowns in the project',
          description:
            'List of every rundown stored in the current project file, plus the ID of the one currently loaded.',
          mimeType: 'application/json',
        },
        {
          uri: 'ontime://project/info',
          name: 'project-info',
          title: 'Project metadata',
          description: 'Project title, description, URL, info, logo, and custom header fields.',
          mimeType: 'application/json',
        },
        {
          uri: 'ontime://project/custom-fields',
          name: 'project-custom-fields',
          title: 'Custom field definitions',
          description:
            'Map of custom field keys to their label, type, and colour. Events reference these keys in their `custom` object.',
          mimeType: 'application/json',
        },
      ],
    };
  });

  // Handle resources/read — return the resource body for a given URI
  server.setRequestHandler(ReadResourceRequestSchema, async (request): Promise<ReadResourceResult> => {
    const uri = request.params.uri;

    if (uri === 'ontime://schema') {
      return {
        contents: [{ uri, mimeType: 'text/markdown', text: ONTIME_SCHEMA_MARKDOWN }],
      };
    }

    if (uri === 'ontime://rundown/current') {
      const rundown = getCurrentRundown();
      return {
        contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(rundown) }],
      };
    }

    if (uri === 'ontime://rundowns') {
      const rundowns = normalisedToRundownArray(getDataProvider().getProjectRundowns());
      const loaded = getCurrentRundown().id;
      return {
        contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ loaded, rundowns }) }],
      };
    }

    if (uri === 'ontime://project/info') {
      return {
        contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(getProjectData()) }],
      };
    }

    if (uri === 'ontime://project/custom-fields') {
      return {
        contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(getProjectCustomFields()) }],
      };
    }

    throw new Error(`Unknown resource URI: ${uri}`);
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
