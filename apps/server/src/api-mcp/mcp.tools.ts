import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  EntryId,
  EventPostPayload,
  InsertOptions,
  OntimeDelay,
  OntimeEvent,
  OntimeGroup,
  OntimeMilestone,
  PatchWithId,
  Playback,
  ProjectData,
  ProjectRundowns,
  SupportedEntry,
} from 'ontime-types';

import { editCurrentProjectData, getProjectData } from '../api-data/project-data/projectData.dao.js';
import {
  getCurrentRundown,
  getCurrentRundownId,
  getProjectCustomFields,
  getRundownMetadata,
} from '../api-data/rundown/rundown.dao.js';
import {
  addEntry,
  batchEditEntries,
  createNewRundown,
  deleteEntries,
  deleteRundown,
  duplicateExistingRundown,
  editEntry,
  loadRundown,
  renameRundown,
  reorderEntry,
} from '../api-data/rundown/rundown.service.js';
import { normalisedToRundownArray } from '../api-data/rundown/rundown.utils.js';
import { getDataProvider } from '../classes/data-provider/DataProvider.js';
import { makeNewProject } from '../models/dataModel.js';
import {
  createProjectWithPatch,
  deleteProjectFile,
  duplicateProjectFile,
  getProjectList,
  loadProjectFile,
  renameProjectFile,
} from '../services/project-service/ProjectService.js';
import { getState } from '../stores/runtimeState.js';
import { EVENT_WRITABLE_FIELDS } from './mcp.schema.js';

// Graceful truncation to keep tool responses within typical MCP context windows
const CHARACTER_LIMIT = 25_000;

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
      'Get the currently loaded rundown. Returns { order: EntryId[], entries: { [id]: OntimeEntry } }. If the rundown exceeds 25 000 chars, returns only the order array with a warning — fetch individual entries with ontime_get_entry.',
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
    name: 'ontime_get_entry',
    description: 'Get a single entry by id or cue. Provide either id or cue (not both). Returns the full entry object.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Entry ID (from rundown.entries key or entry.id)' },
        cue: { type: 'string', description: 'Human-facing cue label' },
      },
    },
    annotations: READ,
  },
  // --- Rundown mutations ---
  {
    name: 'ontime_create_entry',
    description:
      'Create a new entry in the current rundown. Omit after/before to append at the end. For type "event" provide title plus enough timing data for Ontime to infer a strategy: timeStart+duration calculates timeEnd, timeStart+timeEnd calculates duration, and timeEnd+duration calculates timeStart. For "milestone" provide cue/title/note/colour and optional custom values using existing project custom field keys. For "delay" provide duration. For "group" provide title only — set colour, note, custom, or targetDuration with ontime_update_entry after creation.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['event', 'delay', 'milestone', 'group'],
          description:
            'Entry type, defaults to event. event: timed show item; milestone: non-timed marker; delay: schedule shift; group: named container of entries',
        },
        timeStart: { type: 'number', description: 'Event start time in ms from midnight (e.g. 09:00 = 32400000)' },
        timeEnd: { type: 'number', description: 'Event end time in ms from midnight' },
        duration: {
          type: 'number',
          description: 'Duration in ms (events: should equal timeEnd - timeStart; delays: the schedule shift)',
        },
        after: { type: 'string', description: 'Insert after this entry ID' },
        before: { type: 'string', description: 'Insert before this entry ID' },
        ...EVENT_WRITABLE_FIELDS,
      },
    },
    annotations: WRITE,
  },
  {
    name: 'ontime_update_entry',
    description:
      'Update fields of an existing entry (event, milestone, delay or group). Only provided fields are changed. Event time fields (timeStart, timeEnd, duration) are reconciled server-side — you may provide any combination. Group fields: title, note, colour, custom, targetDuration. Delay field: duration. Milestone fields: cue, title, note, colour, custom. Custom values must use existing project custom field keys; adding a new custom field is a separate operation.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'ID of the entry to update' },
        timeStart: { type: 'number', description: 'Start time in ms from midnight' },
        timeEnd: { type: 'number', description: 'End time in ms from midnight' },
        duration: { type: 'number', description: 'Duration in ms' },
        targetDuration: { type: 'number', description: 'Groups only: planned length of the group in ms' },
        ...EVENT_WRITABLE_FIELDS,
      },
    },
    annotations: WRITE_DESTRUCTIVE,
  },
  {
    name: 'ontime_delete_entries',
    description: 'Delete one or more entries (events, milestones, delays, or groups) from the current rundown',
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
    name: 'ontime_reorder_entry',
    description:
      'Move an entry to a new position relative to another entry. Use before/after for sibling reordering; use insert to place an entry inside a group.',
    inputSchema: {
      type: 'object',
      required: ['entryId', 'destinationId', 'order'],
      properties: {
        entryId: { type: 'string', description: 'ID of the entry to move' },
        destinationId: { type: 'string', description: 'ID of the target entry (sibling or parent group)' },
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
    name: 'ontime_batch_create_entries',
    description:
      'Create multiple entries in one call. Use this for "build from agenda" flows to avoid many round trips. Entries are inserted in array order; if `after` is provided it positions the first entry, subsequent entries chain from the previous. For events, provide title plus enough timing data for Ontime to infer a strategy: timeStart+duration calculates timeEnd, timeStart+timeEnd calculates duration, and timeEnd+duration calculates timeStart.',
    inputSchema: {
      type: 'object',
      required: ['entries'],
      properties: {
        after: { type: 'string', description: 'Insert the first entry after this entry ID' },
        entries: {
          type: 'array',
          description: 'Array of entries to create, in desired order',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['event', 'delay', 'milestone', 'group'],
                description: 'Entry type, defaults to event',
              },
              timeStart: { type: 'number', description: 'Event start time in ms from midnight' },
              timeEnd: { type: 'number', description: 'Event end time in ms from midnight' },
              duration: { type: 'number', description: 'Duration in ms' },
              ...EVENT_WRITABLE_FIELDS,
            },
          },
        },
      },
    },
    annotations: WRITE,
  },
  {
    name: 'ontime_batch_update_entries',
    description:
      'Apply the same field values to multiple entries by ID. Use for bulk operations like recolouring all keynotes, skipping all breaks, or setting the same custom value on several entries. Custom values must use existing project custom field keys. Do not use for changes where each entry needs a different value, such as time shifts with different timeStart/timeEnd values; compute those per entry and call ontime_update_entry for each.',
    inputSchema: {
      type: 'object',
      required: ['ids', 'data'],
      properties: {
        ids: { type: 'array', items: { type: 'string' }, description: 'Array of entry IDs to update' },
        data: {
          type: 'object',
          description: 'Partial entry fields to apply to every ID',
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
      'Get the project custom field definitions. Returns { [key]: { label, type: "text"|"image", colour } }. Keys are referenced in entry.custom[key].',
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
      'Create a new project file and switch to it. This stops playback and swaps the loaded project. Omit the .json extension — Ontime appends it.',
    inputSchema: {
      type: 'object',
      required: ['filename'],
      properties: {
        filename: { type: 'string', description: 'Filename without extension, e.g. "my-show"' },
        title: { type: 'string', description: 'Optional project title' },
        description: { type: 'string', description: 'Optional project description' },
      },
    },
    annotations: WRITE_DESTRUCTIVE,
  },
  {
    name: 'ontime_rename_project',
    description: 'Rename a project file. If the renamed project is currently loaded, it is reloaded with the new name.',
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

type ToolName = (typeof TOOL_DEFINITIONS)[number]['name'];

// ---- Tool argument types ----
// Arguments arrive as parsed JSON and are cast once, at the trust boundary, to the types below.
// The types are derived (Pick) from the domain types in ontime-types so that a change to the
// domain model or a service signature fails compilation here rather than drifting silently.

type EventFieldArgs = Partial<
  Pick<
    OntimeEvent,
    | 'cue'
    | 'title'
    | 'note'
    | 'colour'
    | 'skip'
    | 'flag'
    | 'custom'
    | 'timerType'
    | 'endAction'
    | 'linkStart'
    | 'countToEnd'
    | 'timeWarning'
    | 'timeDanger'
    | 'timeStart'
    | 'timeEnd'
    | 'duration'
  >
>;
type MilestoneFieldArgs = Partial<Pick<OntimeMilestone, 'cue' | 'title' | 'note' | 'colour' | 'custom'>>;
type DelayFieldArgs = Partial<Pick<OntimeDelay, 'duration'>>;
type GroupFieldArgs = Partial<Pick<OntimeGroup, 'title' | 'note' | 'colour' | 'targetDuration' | 'custom'>>;

type EntryFieldArgs = EventFieldArgs & MilestoneFieldArgs & DelayFieldArgs & GroupFieldArgs;
type CreateEntryArgs = EntryFieldArgs & InsertOptions & { type?: `${SupportedEntry}` };
type UpdateEntryArgs = EntryFieldArgs & { id: EntryId };
type ProjectInfoArgs = Partial<Pick<ProjectData, 'title' | 'description' | 'url' | 'info'>>;

function assertKnownCustomFields(...customValues: Array<EntryFieldArgs['custom'] | undefined>) {
  const customFields = getProjectCustomFields();
  const knownKeys = new Set(Object.keys(customFields));
  const unknownKeys = new Set<string>();

  for (const custom of customValues) {
    if (!custom) continue;
    for (const key of Object.keys(custom)) {
      if (!knownKeys.has(key)) {
        unknownKeys.add(key);
      }
    }
  }

  if (unknownKeys.size > 0) {
    const keys = [...unknownKeys].join(', ');
    throw new Error(`Unknown custom field key(s): ${keys}. Call ontime_get_custom_fields to list available keys.`);
  }
}

/** Translates tool arguments into the payload consumed by rundown.service addEntry */
function toEntryPayload(args: CreateEntryArgs): EventPostPayload {
  const { type = SupportedEntry.Event, after, before } = args;

  switch (type) {
    case SupportedEntry.Delay:
      return { type: SupportedEntry.Delay, duration: args.duration, after, before };
    case SupportedEntry.Milestone: {
      const { cue, title, note, colour, custom } = args;
      return { type: SupportedEntry.Milestone, cue, title, note, colour, custom, after, before };
    }
    case SupportedEntry.Group:
      // group creation currently only accepts a title, see generateEvent in rundown.utils.ts
      return { type: SupportedEntry.Group, title: args.title, after, before };
    case SupportedEntry.Event: {
      const { type: _type, ...eventFields } = args;
      return { type: SupportedEntry.Event, ...eventFields };
    }
    default:
      throw new Error(`Invalid entry type: ${String(type)}`);
  }
}

/** Formats project rundowns in the standard list payload used by rundown management tools */
function toRundownList(projectRundowns: Readonly<ProjectRundowns>) {
  return { loaded: getCurrentRundownId(), rundowns: normalisedToRundownArray(projectRundowns) };
}

// ---- Response helpers (module-level to avoid re-allocation on every tool call) ----

const text = (data: unknown): string => JSON.stringify(data);

export const ok = (data: unknown): CallToolResult => ({ content: [{ type: 'text', text: text(data) }] });

export const err = (e: unknown): CallToolResult => ({
  content: [{ type: 'text', text: text({ error: e instanceof Error ? e.message : String(e) }) }],
  isError: true,
});

/** Wraps mutating-tool results with a playback warning when Ontime is not stopped */
export const okMutation = (data: unknown): CallToolResult => {
  const playback = getState().timer.playback;
  const payload =
    playback !== Playback.Stop
      ? { warning: 'Playback is running — this change takes effect immediately.', result: data }
      : data;
  return { content: [{ type: 'text', text: text(payload) }] };
};

// ---- Tool handlers ----
// Each handler is a thin translation wrapper: it maps the wire arguments to a typed call
// into an existing service and formats the response. Business logic belongs in the services.
const TOOL_HANDLERS: Record<ToolName, (args: Record<string, unknown>) => Promise<CallToolResult>> = {
  ontime_get_rundown: async () => {
    const rundown = getCurrentRundown();
    const data = { order: rundown.order, entries: rundown.entries };
    const serialised = text(data);
    if (serialised.length > CHARACTER_LIMIT) {
      return ok({
        warning: `Rundown too large (${serialised.length} chars) — fetch individual entries with ontime_get_entry. Entry IDs in order: ${rundown.order.join(', ')}`,
        truncated: true,
        order: rundown.order,
      });
    }
    return ok(data);
  },

  ontime_get_rundown_metadata: async () => ok(getRundownMetadata()),

  ontime_get_entry: async (args) => {
    const { id, cue } = args as { id?: EntryId; cue?: string };
    const rundown = getCurrentRundown();
    if (id) {
      const entry = rundown.entries[id];
      if (!entry) return err(`No entry with id ${id}`);
      return ok(entry);
    }
    if (cue) {
      const entry = Object.values(rundown.entries).find((entry) => 'cue' in entry && entry.cue === cue);
      if (!entry) return err(`No entry with cue ${cue}`);
      return ok(entry);
    }
    return err('Provide id or cue');
  },

  ontime_create_entry: async (args) => {
    const createArgs = args as CreateEntryArgs;
    assertKnownCustomFields(createArgs.custom);
    const entry = await addEntry(getCurrentRundownId(), toEntryPayload(createArgs));
    return okMutation(entry);
  },

  ontime_update_entry: async (args) => {
    const updateArgs = args as UpdateEntryArgs;
    assertKnownCustomFields(updateArgs.custom);
    const entry = await editEntry(getCurrentRundownId(), updateArgs as PatchWithId);
    return okMutation(entry);
  },

  ontime_delete_entries: async (args) => {
    const { ids } = args as { ids: EntryId[] };
    const rundown = await deleteEntries(getCurrentRundownId(), ids);
    return okMutation({ deleted: ids, order: rundown.order });
  },

  ontime_reorder_entry: async (args) => {
    const { entryId, destinationId, order } = args as {
      entryId: EntryId;
      destinationId: EntryId;
      order: 'before' | 'after' | 'insert';
    };
    const rundown = await reorderEntry(getCurrentRundownId(), entryId, destinationId, order);
    return okMutation({ order: rundown.order });
  },

  ontime_batch_create_entries: async (args) => {
    const { entries = [], after } = args as { entries: CreateEntryArgs[]; after?: EntryId };
    assertKnownCustomFields(...entries.map((entry) => entry.custom));
    const rundownId = getCurrentRundownId();
    let previousId = after;
    const created: unknown[] = [];
    for (const entryArgs of entries) {
      const payload = toEntryPayload(entryArgs);
      // eslint-disable-next-line no-await-in-loop -- each entry chains after the previously created one
      const entry = await addEntry(rundownId, previousId ? { ...payload, after: previousId } : payload);
      created.push(entry);
      previousId = entry.id;
    }
    return okMutation({ created });
  },

  ontime_batch_update_entries: async (args) => {
    const { ids, data } = args as { ids: EntryId[]; data: EntryFieldArgs };
    assertKnownCustomFields(data.custom);
    const rundown = await batchEditEntries(getCurrentRundownId(), ids, data);
    return okMutation({ updated: ids, order: rundown.order });
  },

  ontime_list_rundowns: async () => ok(toRundownList(getDataProvider().getProjectRundowns())),

  ontime_create_rundown: async (args) => {
    const { title } = args as { title: string };
    return okMutation(toRundownList(await createNewRundown(title)));
  },

  ontime_load_rundown: async (args) => {
    const { id } = args as { id: string };
    return okMutation(toRundownList(await loadRundown(id)));
  },

  ontime_rename_rundown: async (args) => {
    const { id, title } = args as { id: string; title: string };
    return okMutation(toRundownList(await renameRundown(id, title)));
  },

  ontime_delete_rundown: async (args) => {
    const { id } = args as { id: string };
    return okMutation(toRundownList(await deleteRundown(id)));
  },

  ontime_duplicate_rundown: async (args) => {
    const { id } = args as { id: string };
    return okMutation(toRundownList(await duplicateExistingRundown(id)));
  },

  ontime_get_timer_state: async () => {
    const { clock, timer, eventNow, eventNext, offset } = getState();
    return ok({ clock, timer, eventNow, eventNext, offset });
  },

  ontime_get_project_info: async () => ok(getProjectData()),

  ontime_update_project_info: async (args) => {
    const updated = await editCurrentProjectData(args as ProjectInfoArgs);
    return ok(updated);
  },

  ontime_get_custom_fields: async () => ok(getProjectCustomFields()),

  ontime_list_projects: async () => ok(await getProjectList()),

  ontime_load_project: async (args) => {
    const { filename } = args as { filename: string };
    await loadProjectFile(filename);
    return okMutation(await getProjectList());
  },

  ontime_create_project: async (args) => {
    const {
      filename,
      title = '',
      description = '',
    } = args as {
      filename: string;
      title?: string;
      description?: string;
    };
    const project: ProjectData = { ...makeNewProject().project, title, description };
    const newFileName = await createProjectWithPatch(filename, { project });
    return okMutation({ filename: newFileName });
  },

  ontime_rename_project: async (args) => {
    const { filename, newFilename } = args as { filename: string; newFilename: string };
    await renameProjectFile(filename, newFilename);
    return ok(await getProjectList());
  },

  ontime_duplicate_project: async (args) => {
    const { filename, newFilename } = args as { filename: string; newFilename: string };
    await duplicateProjectFile(filename, newFilename);
    return ok(await getProjectList());
  },

  ontime_delete_project: async (args) => {
    const { filename } = args as { filename: string };
    await deleteProjectFile(filename);
    return ok(await getProjectList());
  },
};

// ---- Tool call dispatcher ----
export async function handleToolCall(name: string, args: Record<string, unknown>): Promise<CallToolResult> {
  const handler = TOOL_HANDLERS[name as ToolName];
  if (!handler) {
    return err(`Unknown tool: ${name}`);
  }
  try {
    return await handler(args);
  } catch (error) {
    return err(error);
  }
}
