import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { EntryId, ProjectData } from 'ontime-types';

import { editCurrentProjectData, getProjectData } from '../api-data/project-data/projectData.dao.js';
import { getProjectCustomFields, getRundownMetadata } from '../api-data/rundown/rundown.dao.js';
import {
  createNewRundown,
  deleteRundown,
  duplicateExistingRundown,
  loadRundown,
  renameRundown,
} from '../api-data/rundown/rundown.service.js';
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
import { EVENT_WRITABLE_FIELDS, RUNDOWN_TARGET_FIELD } from './mcp.schema.js';
import {
  batchCreateEntriesForMcp,
  batchUpdateEntriesForMcp,
  createCustomFieldForMcp,
  createEntryForMcp,
  deleteCustomFieldForMcp,
  deleteEntriesForMcp,
  findEntry,
  getRundownById,
  groupEntriesForMcp,
  reorderEntryForMcp,
  toRundownList,
  ungroupEntryForMcp,
  updateCustomFieldForMcp,
  updateEntryForMcp,
  type BatchCreateEntryArgs,
  type CreateEntryArgs,
  type EntryFieldArgs,
  type GroupEntriesArgs,
  type TargetRundownArgs,
  type UngroupEntryArgs,
  type UpdateEntryArgs,
} from './mcp.service.js';

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
      'Get a rundown. Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to read a background rundown. Returns { order: EntryId[], entries: { [id]: OntimeEntry } }. If the rundown exceeds 25 000 chars, returns only the order array with a warning — fetch individual entries with ontime_get_entry.',
    inputSchema: { type: 'object', properties: { ...RUNDOWN_TARGET_FIELD } },
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
    description:
      'Get a single entry by id or cue. Provide either id or cue (not both). Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to read a background rundown. Returns the full entry object.',
    inputSchema: {
      type: 'object',
      properties: {
        ...RUNDOWN_TARGET_FIELD,
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
      'Create a new entry. Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. If playback is running and rundownId is omitted or matches the loaded rundown, confirm the user intends to change the live rundown before calling. Omit after/before to append at the end. For type "event" provide title plus enough timing data for Ontime to infer a strategy: timeStart+duration calculates timeEnd, timeStart+timeEnd calculates duration and locks end, timeEnd+duration calculates timeStart, and all three prioritise duration. For "milestone" provide cue/title/note/colour and optional custom values using existing project custom field keys. For "delay" provide duration. For "group" provide title plus optional note/colour/custom/targetDuration.',
    inputSchema: {
      type: 'object',
      properties: {
        ...RUNDOWN_TARGET_FIELD,
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
        targetDuration: { type: 'number', description: 'Groups only: planned length of the group in ms' },
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
      'Update fields of an existing entry (event, milestone, delay or group). Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. If playback is running and rundownId is omitted or matches the loaded rundown, confirm the user intends to change the live rundown before calling. Only provided fields are changed. Event time fields (timeStart, timeEnd, duration) are reconciled server-side — you may provide any combination. Group fields: title, note, colour, custom, targetDuration. Delay field: duration. Milestone fields: cue, title, note, colour, custom. Custom values must use existing project custom field keys; adding a new custom field is a separate operation.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        ...RUNDOWN_TARGET_FIELD,
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
    description:
      'Delete one or more entries (events, milestones, delays, or groups). Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it.',
    inputSchema: {
      type: 'object',
      required: ['ids'],
      properties: {
        ...RUNDOWN_TARGET_FIELD,
        ids: { type: 'array', items: { type: 'string' }, description: 'Array of entry IDs to delete' },
      },
    },
    annotations: WRITE_DESTRUCTIVE,
  },
  {
    name: 'ontime_reorder_entry',
    description:
      'Move an entry to a new position relative to another entry. Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. Use before/after for sibling reordering; use insert for targeted moves into a group. For grouping several existing top-level entries, prefer ontime_group_entries.',
    inputSchema: {
      type: 'object',
      required: ['entryId', 'destinationId', 'order'],
      properties: {
        ...RUNDOWN_TARGET_FIELD,
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
    name: 'ontime_group_entries',
    description:
      'Create a group from existing top-level entries. Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. If playback is running and rundownId is omitted or matches the loaded rundown, confirm the user intends to change the live rundown before calling. Entries must be existing top-level non-group entries; groups cannot be nested. Optional title, note, colour, custom, and targetDuration are applied to the created group.',
    inputSchema: {
      type: 'object',
      required: ['ids'],
      properties: {
        ...RUNDOWN_TARGET_FIELD,
        ids: { type: 'array', items: { type: 'string' }, description: 'Existing top-level entry IDs to group' },
        title: { type: 'string', description: 'Group title shown in the rundown and views' },
        note: { type: 'string', description: 'Free-text group note for production notes or references' },
        colour: { type: 'string', description: 'Hex colour (#RRGGBB) for the group' },
        custom: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Custom field values keyed by existing project field key',
        },
        targetDuration: { type: 'number', description: 'Planned length of the group in ms' },
      },
    },
    annotations: WRITE,
  },
  {
    name: 'ontime_ungroup_entry',
    description:
      'Dissolve a group by moving its children to the top level where the group was. Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. If playback is running and rundownId is omitted or matches the loaded rundown, confirm the user intends to change the live rundown before calling.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        ...RUNDOWN_TARGET_FIELD,
        id: { type: 'string', description: 'Group entry ID to dissolve' },
      },
    },
    annotations: WRITE_DESTRUCTIVE,
  },
  {
    name: 'ontime_batch_create_entries',
    description:
      'Create multiple entries, including groups with nested children. Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. If playback is running and rundownId is omitted or matches the loaded rundown, confirm the user intends to change the live rundown before calling. Use this for "build from agenda" flows to avoid many round trips. Entries are inserted in array order; if `after` is provided it positions the first top-level entry, subsequent top-level entries chain from the previous. A group entry may include `children`; those entries are created inside the group in array order. Groups cannot be nested. For events, provide title plus enough timing data for Ontime to infer a strategy: timeStart+duration calculates timeEnd, timeStart+timeEnd calculates duration and locks end, timeEnd+duration calculates timeStart, and all three prioritise duration.',
    inputSchema: {
      type: 'object',
      required: ['entries'],
      properties: {
        ...RUNDOWN_TARGET_FIELD,
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
              targetDuration: { type: 'number', description: 'Groups only: planned length of the group in ms' },
              children: {
                type: 'array',
                description:
                  'For group entries only: child events, milestones, or delays to create inside this group in order. Nested groups are not supported.',
                items: { type: 'object' },
              },
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
      'Apply the same field values to multiple entries by ID. Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. Use for bulk operations like recolouring all keynotes, skipping all breaks, or setting the same custom value on several entries. Custom values must use existing project custom field keys. Do not use for changes where each entry needs a different value, such as time shifts with different timeStart/timeEnd values; compute those per entry and call ontime_update_entry for each.',
    inputSchema: {
      type: 'object',
      required: ['ids', 'data'],
      properties: {
        ...RUNDOWN_TARGET_FIELD,
        ids: { type: 'array', items: { type: 'string' }, description: 'Array of entry IDs to update' },
        data: {
          type: 'object',
          description: 'Partial entry fields to apply to every ID',
          properties: {
            timeStart: { type: 'number', description: 'Start time in ms from midnight' },
            timeEnd: { type: 'number', description: 'End time in ms from midnight' },
            duration: { type: 'number', description: 'Duration in ms' },
            targetDuration: { type: 'number', description: 'Groups only: planned length of the group in ms' },
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
      'Make a rundown the active rundown. This resets the runtime and clears playback state. If playback is running, confirm the user accepts interrupting the live rundown before calling. To edit a background rundown without interrupting playback, advise using the cuesheet view.',
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
  {
    name: 'ontime_create_custom_field',
    description:
      'Create a new project-level custom field definition. Custom fields add typed columns to every entry in all rundowns. The key is auto-derived from the label (spaces → underscores, e.g. "Camera Angle" → "Camera_Angle"). After creation, use the key in entry.custom when creating or updating entries.',
    inputSchema: {
      type: 'object',
      required: ['label', 'type', 'colour'],
      properties: {
        label: {
          type: 'string',
          description:
            'Human-readable label (alphanumeric with spaces, e.g. "Camera"). Determines the key — ask the user to confirm before creating to avoid duplicates like "Cam", "camera", "Cameras".',
        },
        type: {
          type: 'string',
          enum: ['text', 'image'],
          description: 'Field type — cannot be changed after creation. Use "text" for short text values; "image" for image URLs.',
        },
        colour: {
          type: 'string',
          description: 'Hex colour (#RRGGBB) used to visually identify this column in the cuesheet.',
        },
      },
    },
    annotations: WRITE,
  },
  {
    name: 'ontime_update_custom_field',
    description:
      'Update a custom field label or colour. Changing the label renames the derived key (spaces → underscores) and updates all entry references across all rundowns. Field type cannot be changed.',
    inputSchema: {
      type: 'object',
      required: ['key'],
      properties: {
        key: { type: 'string', description: 'Current field key (from ontime_get_custom_fields)' },
        label: { type: 'string', description: 'New human-readable label (optional). Changes the derived key and cascades to all entries.' },
        colour: { type: 'string', description: 'New hex colour (#RRGGBB) (optional)' },
      },
    },
    annotations: WRITE_IDEM,
  },
  {
    name: 'ontime_delete_custom_field',
    description:
      'Delete a custom field definition and remove its values from all entries in all rundowns. Destructive and cannot be undone — confirm with the user before calling.',
    inputSchema: {
      type: 'object',
      required: ['key'],
      properties: {
        key: { type: 'string', description: 'Field key to delete (from ontime_get_custom_fields)' },
      },
    },
    annotations: WRITE_DESTRUCTIVE,
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
      'Load a different project file by filename. This swaps the database and reinitialises runtime. If playback is running, confirm the user accepts interrupting the live project before calling.',
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
      'Create a new project file and switch to it. This swaps the loaded project. If playback is running, confirm the user accepts interrupting the live project before calling. Omit the .json extension — Ontime appends it.',
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

type ProjectInfoArgs = Partial<Pick<ProjectData, 'title' | 'description' | 'url' | 'info'>>;

// ---- Response helpers (module-level to avoid re-allocation on every tool call) ----

const text = (data: unknown): string => JSON.stringify(data);

export const ok = (data: unknown): CallToolResult => ({ content: [{ type: 'text', text: text(data) }] });

export const err = (e: unknown): CallToolResult => ({
  content: [{ type: 'text', text: text({ error: e instanceof Error ? e.message : String(e) }) }],
  isError: true,
});

// ---- Tool handlers ----
// Each handler is a thin translation wrapper: it maps the wire arguments to a typed call
// into an existing service and formats the response. Business logic belongs in the services.
const TOOL_HANDLERS: Record<ToolName, (args: Record<string, unknown>) => Promise<CallToolResult>> = {
  ontime_get_rundown: async (args) => {
    const targetArgs = args as TargetRundownArgs;
    const rundown = getRundownById(targetArgs.rundownId);
    const data = { order: rundown.order, entries: rundown.entries };
    const serialised = text(data);
    if (serialised.length > CHARACTER_LIMIT) {
      return ok({
        warning: `Rundown too large (${serialised.length} chars) — fetch individual entries with ontime_get_entry. Entry IDs in order: ${rundown.order.join(', ')}`,
        truncated: true,
        rundownId: rundown.id,
        order: rundown.order,
      });
    }
    return ok({ rundownId: rundown.id, ...data });
  },

  ontime_get_rundown_metadata: async () => ok(getRundownMetadata()),

  ontime_get_entry: async (args) => {
    const entryArgs = args as TargetRundownArgs & { id?: EntryId; cue?: string };
    const entry = findEntry(entryArgs);
    if (entry) return ok(entry);
    if (entryArgs.id) return err(`No entry with id ${entryArgs.id}`);
    if (entryArgs.cue) return err(`No entry with cue ${entryArgs.cue}`);
    return err('Provide id or cue');
  },

  ontime_create_entry: async (args) => {
    return ok(await createEntryForMcp(args as CreateEntryArgs));
  },

  ontime_update_entry: async (args) => {
    return ok(await updateEntryForMcp(args as UpdateEntryArgs));
  },

  ontime_delete_entries: async (args) => {
    return ok(await deleteEntriesForMcp(args as TargetRundownArgs & { ids: EntryId[] }));
  },

  ontime_reorder_entry: async (args) => {
    return ok(
      await reorderEntryForMcp(
        args as TargetRundownArgs & {
          entryId: EntryId;
          destinationId: EntryId;
          order: 'before' | 'after' | 'insert';
        },
      ),
    );
  },

  ontime_group_entries: async (args) => {
    return ok(await groupEntriesForMcp(args as GroupEntriesArgs));
  },

  ontime_ungroup_entry: async (args) => {
    return ok(await ungroupEntryForMcp(args as UngroupEntryArgs));
  },

  ontime_batch_create_entries: async (args) => {
    return ok(
      await batchCreateEntriesForMcp(args as TargetRundownArgs & { entries: BatchCreateEntryArgs[]; after?: EntryId }),
    );
  },

  ontime_batch_update_entries: async (args) => {
    return ok(await batchUpdateEntriesForMcp(args as TargetRundownArgs & { ids: EntryId[]; data: EntryFieldArgs }));
  },

  ontime_list_rundowns: async () => ok(toRundownList(getDataProvider().getProjectRundowns())),

  ontime_create_rundown: async (args) => {
    const { title } = args as { title: string };
    return ok(toRundownList(await createNewRundown(title)));
  },

  ontime_load_rundown: async (args) => {
    const { id } = args as { id: string };
    return ok(toRundownList(await loadRundown(id)));
  },

  ontime_rename_rundown: async (args) => {
    const { id, title } = args as { id: string; title: string };
    return ok(toRundownList(await renameRundown(id, title)));
  },

  ontime_delete_rundown: async (args) => {
    const { id } = args as { id: string };
    return ok(toRundownList(await deleteRundown(id)));
  },

  ontime_duplicate_rundown: async (args) => {
    const { id } = args as { id: string };
    return ok(toRundownList(await duplicateExistingRundown(id)));
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

  ontime_create_custom_field: async (args) => {
    return ok(await createCustomFieldForMcp(args as { label: string; type: 'text' | 'image'; colour: string }));
  },

  ontime_update_custom_field: async (args) => {
    return ok(await updateCustomFieldForMcp(args as { key: string; label?: string; colour?: string }));
  },

  ontime_delete_custom_field: async (args) => {
    return ok(await deleteCustomFieldForMcp(args as { key: string }));
  },

  ontime_list_projects: async () => ok(await getProjectList()),

  ontime_load_project: async (args) => {
    const { filename } = args as { filename: string };
    await loadProjectFile(filename);
    return ok(await getProjectList());
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
    return ok({ filename: newFileName });
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
