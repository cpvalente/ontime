import { SupportedEntry } from 'ontime-types';

import { editCurrentProjectData, getProjectData } from '../api-data/project-data/projectData.dao.js';
import { getCurrentRundown, getRundownMetadata, getProjectCustomFields } from '../api-data/rundown/rundown.dao.js';
import {
  addEntry,
  editEntry,
  deleteEntries,
  reorderEntry,
  loadRundown,
  batchEditEntries,
} from '../api-data/rundown/rundown.service.js';
import { duplicateRundown } from '../api-data/rundown/rundown.utils.js';
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
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { deleteRundown, renameRundown, rundownListResponse } from './mcp.service.js';

// Graceful truncation to keep tool responses within typical MCP context windows
const CHARACTER_LIMIT = 25_000;

// ---- Shared event field JSON schemas ----
// Reused across create_event, update_event, create_events_batch, batch_update_events to avoid repetition.
const EVENT_TIMER_FIELDS = {
  timerType: {
    type: 'string',
    enum: ['count-down', 'count-up', 'clock', 'none'],
    description: 'count-down: countdown from duration; count-up: elapsed time; clock: wall clock; none: no timer shown',
  },
  endAction: {
    type: 'string',
    enum: ['none', 'load-next', 'play-next'],
    description: 'Action when event ends: none = stop, load-next = cue next event, play-next = auto-start next event',
  },
  linkStart: {
    type: 'boolean',
    description:
      "Chain this event's start time to the previous event's end time — changing the first linked event propagates schedule changes to all linked followers",
  },
  countToEnd: { type: 'boolean', description: 'Timer counts toward the scheduled end time rather than elapsed time' },
  timeWarning: { type: 'number', description: 'ms before timeEnd to enter warning state (e.g. 300000 = 5 min)' },
  timeDanger: { type: 'number', description: 'ms before timeEnd to enter danger state (e.g. 60000 = 1 min)' },
} as const;

const EVENT_WRITABLE_FIELDS = {
  cue: { type: 'string', description: 'Short free-form cue label — ask the user what naming convention they prefer' },
  title: { type: 'string', description: 'Event title shown in the rundown and views' },
  note: { type: 'string', description: 'Free-text note for production notes or references' },
  colour: {
    type: 'string',
    description: 'Hex colour (#RRGGBB) for visual grouping — ask the user what colour convention they use',
  },
  skip: { type: 'boolean', description: 'If true, event is skipped during playback' },
  ...EVENT_TIMER_FIELDS,
} as const;

// ---- MCP tool annotation presets ----
// https://modelcontextprotocol.io/docs/concepts/tools#tool-annotations
const READ = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;
const WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false } as const;
const WRITE_IDEM = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;
const WRITE_DESTRUCTIVE = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: false,
} as const;

// ---- Tool definitions ----
export const TOOL_DEFINITIONS = [
  // --- Rundown read ---
  {
    name: 'ontime_get_rundown',
    description:
      'Get the currently loaded rundown. Returns { order: EntryId[], entries: { [id]: OntimeEntry } }. If the rundown exceeds 25 000 chars, returns only the order array with a warning — fetch individual events with ontime_get_event.',
    inputSchema: { type: 'object', properties: {} },
    annotations: READ,
  },
  {
    name: 'ontime_get_rundown_metadata',
    description:
      'Get cached metadata for the current rundown. Returns: totalDelay, totalDuration, totalDays, firstStart, lastEnd, flags (flagged entry IDs), playableEventOrder, timedEventOrder, flatEntryOrder.',
    inputSchema: { type: 'object', properties: {} },
    annotations: READ,
  },
  {
    name: 'ontime_get_event',
    description: 'Get a single event by id or cue. Provide either id or cue (not both). Returns the full entry object.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Event ID (from rundown.entries key or event.id)' },
        cue: { type: 'string', description: 'Human-facing cue label' },
      },
    },
    annotations: READ,
  },
  // --- Rundown mutations ---
  {
    name: 'ontime_create_event',
    description: 'Create a new event in the rundown. Omit after/before to append at the end.',
    inputSchema: {
      type: 'object',
      required: ['cue', 'title', 'timeStart', 'timeEnd', 'duration'],
      properties: {
        cue: { type: 'string', description: 'Short free-form cue label — ask the user what naming convention they prefer' },
        title: { type: 'string', description: 'Event title shown in the rundown and views' },
        timeStart: { type: 'number', description: 'Start time in ms from midnight (e.g. 09:00 = 32400000)' },
        timeEnd: { type: 'number', description: 'End time in ms from midnight' },
        duration: { type: 'number', description: 'Duration in ms (should equal timeEnd - timeStart)' },
        after: { type: 'string', description: 'Insert after this event ID' },
        before: { type: 'string', description: 'Insert before this event ID' },
        note: { type: 'string', description: 'Free-text note for production notes or references' },
        colour: {
          type: 'string',
          description: 'Hex colour (#RRGGBB) for visual grouping — ask the user what colour convention they use',
        },
        skip: { type: 'boolean', description: 'If true, event is skipped during playback' },
        ...EVENT_TIMER_FIELDS,
      },
    },
    annotations: WRITE,
  },
  {
    name: 'ontime_update_event',
    description:
      'Update fields of an existing event. Only provided fields are changed. Time fields (timeStart, timeEnd, duration) are reconciled server-side — you may provide any combination.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'ID of the event to update' },
        timeStart: { type: 'number', description: 'Start time in ms from midnight' },
        timeEnd: { type: 'number', description: 'End time in ms from midnight' },
        duration: { type: 'number', description: 'Duration in ms' },
        ...EVENT_WRITABLE_FIELDS,
      },
    },
    annotations: WRITE_DESTRUCTIVE,
  },
  {
    name: 'ontime_delete_entry',
    description: 'Delete one or more entries (events, delays, or groups) from the rundown',
    inputSchema: {
      type: 'object',
      required: ['ids'],
      properties: {
        ids: { type: 'array', items: { type: 'string' }, description: 'Array of entry IDs to delete' },
      },
    },
    annotations: WRITE_DESTRUCTIVE,
  },
  {
    name: 'ontime_reorder_event',
    description:
      'Move an event to a new position relative to another event. Use before/after for sibling reordering; use insert to place an event inside a group.',
    inputSchema: {
      type: 'object',
      required: ['entryId', 'destinationId', 'order'],
      properties: {
        entryId: { type: 'string', description: 'ID of the event to move' },
        destinationId: { type: 'string', description: 'ID of the target event (sibling or parent group)' },
        order: {
          type: 'string',
          enum: ['before', 'after', 'insert'],
          description: 'before/after: place as sibling; insert: place inside a group',
        },
      },
    },
    annotations: WRITE_IDEM,
  },
  {
    name: 'ontime_create_events_batch',
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
              cue: {
                type: 'string',
                description: 'Short free-form cue label — ask the user what naming convention they prefer',
              },
              title: { type: 'string', description: 'Event title shown in the rundown and views' },
              timeStart: { type: 'number', description: 'Start time in ms from midnight' },
              timeEnd: { type: 'number', description: 'End time in ms from midnight' },
              duration: { type: 'number', description: 'Duration in ms (should equal timeEnd - timeStart)' },
              note: { type: 'string', description: 'Free-text note for production notes or references' },
              colour: {
                type: 'string',
                description: 'Hex colour (#RRGGBB) for visual grouping — ask the user what colour convention they use',
              },
              skip: { type: 'boolean', description: 'If true, event is skipped during playback' },
              ...EVENT_TIMER_FIELDS,
            },
          },
        },
      },
    },
    annotations: WRITE,
  },
  {
    name: 'ontime_batch_update_events',
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
            timeStart: { type: 'number', description: 'Start time in ms from midnight' },
            timeEnd: { type: 'number', description: 'End time in ms from midnight' },
            duration: { type: 'number', description: 'Duration in ms' },
            ...EVENT_WRITABLE_FIELDS,
          },
        },
      },
    },
    annotations: WRITE_DESTRUCTIVE,
  },
  // --- Rundown management ---
  {
    name: 'ontime_list_rundowns',
    description:
      'List all rundowns in the current project. Returns rundown IDs and titles, plus the ID of the currently loaded one.',
    inputSchema: { type: 'object', properties: {} },
    annotations: READ,
  },
  {
    name: 'ontime_create_rundown',
    description:
      'Create a new empty rundown in the current project. Does not switch to it — use ontime_load_rundown to activate.',
    inputSchema: {
      type: 'object',
      required: ['title'],
      properties: { title: { type: 'string', description: 'Title for the new rundown' } },
    },
    annotations: WRITE,
  },
  {
    name: 'ontime_load_rundown',
    description:
      'Make a rundown the active rundown. Resets the runtime and clears playback state. Prefer to use when playback is stopped.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string', description: 'Rundown ID to load' } },
    },
    annotations: WRITE_DESTRUCTIVE,
  },
  {
    name: 'ontime_rename_rundown',
    description: 'Rename an existing rundown',
    inputSchema: {
      type: 'object',
      required: ['id', 'title'],
      properties: {
        id: { type: 'string', description: 'Rundown ID to rename' },
        title: { type: 'string', description: 'New title' },
      },
    },
    annotations: WRITE_IDEM,
  },
  {
    name: 'ontime_delete_rundown',
    description: 'Delete a rundown (cannot delete the currently loaded rundown or the last remaining rundown)',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string', description: 'Rundown ID to delete' } },
    },
    annotations: WRITE_DESTRUCTIVE,
  },
  {
    name: 'ontime_duplicate_rundown',
    description: 'Duplicate a rundown, creating a copy with a new ID. Does not switch to the copy.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string', description: 'Rundown ID to duplicate' } },
    },
    annotations: WRITE,
  },
  // --- Timer & project ---
  {
    name: 'ontime_get_timer_state',
    description:
      'Get the current timer/playback state. Returns: clock (time of day), timer ({ playback, current, elapsed, phase, expectedFinish, addedTime, startedAt }), eventNow (full event object or null), eventNext (full event object or null), offset.',
    inputSchema: { type: 'object', properties: {} },
    annotations: READ,
  },
  {
    name: 'ontime_get_project_info',
    description:
      'Get current project metadata: title, description, url, info, logo, and custom header fields (array of { title, value, url }).',
    inputSchema: { type: 'object', properties: {} },
    annotations: READ,
  },
  {
    name: 'ontime_update_project_info',
    description: 'Update project metadata fields. All fields are optional — only provided fields are updated.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Project title' },
        description: { type: 'string', description: 'Project description' },
        url: { type: 'string', description: 'URL shown on viewer pages' },
        info: { type: 'string', description: 'Info text shown on viewer pages' },
      },
    },
    annotations: WRITE_DESTRUCTIVE,
  },
  {
    name: 'ontime_get_custom_fields',
    description:
      'Get the project custom field definitions. Returns { [key]: { label, type: "text"|"image", colour } }. Keys are referenced in event.custom[key].',
    inputSchema: { type: 'object', properties: {} },
    annotations: READ,
  },
  // --- Project file management ---
  {
    name: 'ontime_list_projects',
    description: 'List all project files on disk. Returns filenames, timestamps, and the last-loaded project name.',
    inputSchema: { type: 'object', properties: {} },
    annotations: READ,
  },
  {
    name: 'ontime_load_project',
    description:
      'Load a different project file by filename. This stops playback, swaps the database, and reinitialises runtime. Prefer to use when playback is stopped.',
    inputSchema: {
      type: 'object',
      required: ['filename'],
      properties: { filename: { type: 'string', description: 'Project filename, e.g. "my-show.json"' } },
    },
    annotations: WRITE_DESTRUCTIVE,
  },
  {
    name: 'ontime_create_project',
    description:
      'Create a new empty project file and save it to disk. Does not switch to the new project. Omit the .json extension — Ontime appends it.',
    inputSchema: {
      type: 'object',
      required: ['filename'],
      properties: {
        filename: { type: 'string', description: 'Filename without extension, e.g. "my-show"' },
        title: { type: 'string', description: 'Optional project title' },
        description: { type: 'string', description: 'Optional project description' },
      },
    },
    annotations: WRITE,
  },
  {
    name: 'ontime_rename_project',
    description:
      'Rename a project file. If the renamed project is currently loaded, it is reloaded with the new name.',
    inputSchema: {
      type: 'object',
      required: ['filename', 'newFilename'],
      properties: {
        filename: { type: 'string', description: 'Current filename (with .json extension)' },
        newFilename: { type: 'string', description: 'New filename (with .json extension)' },
      },
    },
    annotations: WRITE_IDEM,
  },
  {
    name: 'ontime_duplicate_project',
    description: 'Duplicate a project file on disk with a new filename. Does not switch to the copy.',
    inputSchema: {
      type: 'object',
      required: ['filename', 'newFilename'],
      properties: {
        filename: { type: 'string', description: 'Source filename to copy (with .json extension)' },
        newFilename: { type: 'string', description: 'Filename of the new copy (with .json extension)' },
      },
    },
    annotations: WRITE,
  },
  {
    name: 'ontime_delete_project',
    description: 'Delete a project file from disk. Fails if the file is currently loaded.',
    inputSchema: {
      type: 'object',
      required: ['filename'],
      properties: { filename: { type: 'string', description: 'Project filename to delete (with .json extension)' } },
    },
    annotations: WRITE_DESTRUCTIVE,
  },
] as const;

// ---- Response helpers (module-level to avoid re-allocation on every tool call) ----

const text = (data: unknown): string => JSON.stringify(data);

export const ok = (data: unknown): CallToolResult => ({ content: [{ type: 'text', text: text(data) }] });

export const err = (e: unknown): CallToolResult => ({
  content: [{ type: 'text', text: text({ error: String(e) }) }],
  isError: true,
});

/** Wraps mutating-tool results with a playback warning when Ontime is not stopped */
export const okMutation = (data: unknown): CallToolResult => {
  const playback = getState().timer.playback;
  const payload =
    playback !== 'stop'
      ? { warning: 'Playback is running — this change takes effect immediately.', result: data }
      : data;
  return { content: [{ type: 'text', text: text(payload) }] };
};

// ---- Tool call dispatcher ----
export async function handleToolCall(name: string, args: Record<string, unknown>): Promise<CallToolResult> {
  switch (name) {
    case 'ontime_get_rundown': {
      const rundown = getCurrentRundown();
      const data = { order: rundown.order, entries: rundown.entries };
      const serialised = text(data);
      if (serialised.length > CHARACTER_LIMIT) {
        return ok({
          warning: `Rundown too large (${serialised.length} chars) — fetch individual entries with ontime_get_event. Entry IDs in order: ${rundown.order.join(', ')}`,
          truncated: true,
          order: rundown.order,
        });
      }
      return ok(data);
    }

    case 'ontime_get_rundown_metadata':
      return ok(getRundownMetadata());

    case 'ontime_get_event': {
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

    case 'ontime_create_event': {
      try {
        const entry = await addEntry({ type: SupportedEntry.Event, ...args } as never);
        return okMutation(entry);
      } catch (e) {
        return err(e);
      }
    }

    case 'ontime_update_event': {
      try {
        const entry = await editEntry(args as never);
        return okMutation(entry);
      } catch (e) {
        return err(e);
      }
    }

    case 'ontime_delete_entry': {
      try {
        const ids = args.ids as string[];
        const rundown = await deleteEntries(ids);
        return okMutation({ deleted: ids, order: rundown.order });
      } catch (e) {
        return err(e);
      }
    }

    case 'ontime_reorder_event': {
      try {
        const { entryId, destinationId, order } = args as {
          entryId: string;
          destinationId: string;
          order: 'before' | 'after' | 'insert';
        };
        const rundown = await reorderEntry(entryId, destinationId, order);
        return okMutation({ order: rundown.order });
      } catch (e) {
        return err(e);
      }
    }

    case 'ontime_create_events_batch': {
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

    case 'ontime_batch_update_events': {
      try {
        const ids = args.ids as string[];
        const data = args.data as Partial<Record<string, unknown>>;
        const rundown = await batchEditEntries(ids, data as never);
        return okMutation({ updated: ids, order: rundown.order });
      } catch (e) {
        return err(e);
      }
    }

    case 'ontime_list_rundowns':
      return ok(rundownListResponse());

    case 'ontime_create_rundown': {
      try {
        const rundown = makeNewRundown();
        rundown.title = args.title as string;
        await getDataProvider().setRundown(rundown.id, rundown);
        return okMutation(rundownListResponse());
      } catch (e) {
        return err(e);
      }
    }

    case 'ontime_load_rundown': {
      try {
        await loadRundown(args.id as string);
        return okMutation(rundownListResponse());
      } catch (e) {
        return err(e);
      }
    }

    case 'ontime_rename_rundown': {
      try {
        const result = await renameRundown(args.id as string, args.title as string);
        return okMutation(result);
      } catch (e) {
        return err(e);
      }
    }

    case 'ontime_delete_rundown': {
      try {
        const result = await deleteRundown(args.id as string);
        return okMutation(result);
      } catch (e) {
        return err(e);
      }
    }

    case 'ontime_duplicate_rundown': {
      try {
        const id = args.id as string;
        const dataProvider = getDataProvider();
        const rundown = dataProvider.getRundown(id);
        if (!rundown) throw new Error(`Rundown ${id} not found`);
        const copy = duplicateRundown(rundown as never, `Copy of ${rundown.title}`);
        await dataProvider.setRundown(copy.id, copy);
        return okMutation(rundownListResponse());
      } catch (e) {
        return err(e);
      }
    }

    case 'ontime_get_timer_state': {
      const state = getState();
      return ok({
        clock: state.clock,
        timer: state.timer,
        eventNow: state.eventNow,
        eventNext: state.eventNext,
        offset: state.offset,
      });
    }

    case 'ontime_get_project_info':
      return ok(getProjectData());

    case 'ontime_update_project_info': {
      try {
        const updated = await editCurrentProjectData(args as never);
        return ok(updated);
      } catch (e) {
        return err(e);
      }
    }

    case 'ontime_get_custom_fields':
      return ok(getProjectCustomFields());

    case 'ontime_list_projects':
      return ok(await getProjectList());

    case 'ontime_load_project': {
      try {
        await loadProjectFile(args.filename as string);
        return okMutation(await getProjectList());
      } catch (e) {
        return err(e);
      }
    }

    case 'ontime_create_project': {
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

    case 'ontime_rename_project': {
      try {
        const { filename, newFilename } = args as { filename: string; newFilename: string };
        await renameProjectFile(filename, newFilename);
        return ok(await getProjectList());
      } catch (e) {
        return err(e);
      }
    }

    case 'ontime_duplicate_project': {
      try {
        const { filename, newFilename } = args as { filename: string; newFilename: string };
        await duplicateProjectFile(filename, newFilename);
        return ok(await getProjectList());
      } catch (e) {
        return err(e);
      }
    }

    case 'ontime_delete_project': {
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
