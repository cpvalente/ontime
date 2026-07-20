import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ProjectData } from 'ontime-types';
import { z } from 'zod';

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
} from './mcp.service.js';
import * as schemas from './mcp.tools.schema.js';

/**
 * Parses tool-call arguments against `schema`, throwing on failure. handleToolCall (below)
 * already wraps every handler in try/catch and formats thrown errors into a CallToolResult,
 * so this reuses that existing error path rather than inventing a second one — unlike the
 * REST validation layer (apps/server/src/api-data/validation-utils/validate.ts), tool calls
 * are not a hot request path, so .parse()'s throw-based control flow costs nothing here.
 */
function parseArgs<T extends z.ZodType>(schema: T, args: Record<string, unknown>): z.infer<T> {
  return schema.parse(args);
}

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
    inputSchema: z.toJSONSchema(schemas.getRundownSchema),
    annotations: READ,
  },
  {
    name: 'ontime_get_rundown_metadata',
    description:
      'Get cached metadata for the current rundown. Returns: totalDelay, totalDuration, totalDays, firstStart, lastEnd, flags (flagged entry IDs), playableEventOrder, timedEventOrder, flatEntryOrder.',
    inputSchema: z.toJSONSchema(schemas.getRundownMetadataSchema),
    annotations: READ,
  },
  {
    name: 'ontime_get_entry',
    description:
      'Get a single entry by id or cue. Provide either id or cue (not both). Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to read a background rundown. Returns the full entry object.',
    inputSchema: z.toJSONSchema(schemas.getEntrySchema),
    annotations: READ,
  },
  // --- Rundown mutations ---
  {
    name: 'ontime_create_entry',
    description:
      'Create a new entry. Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. If playback is running and rundownId is omitted or matches the loaded rundown, confirm the user intends to change the live rundown before calling. Omit after/before to append at the end. For type "event" provide title plus enough timing data for Ontime to infer a strategy: timeStart+duration calculates timeEnd, timeStart+timeEnd calculates duration and locks end, timeEnd+duration calculates timeStart, and all three prioritise duration. For "milestone" provide cue/title/note/colour and optional custom values using existing project custom field keys. For "delay" provide duration. For "group" provide title plus optional note/colour/custom/targetDuration.',
    inputSchema: z.toJSONSchema(schemas.createEntrySchema),
    annotations: WRITE,
  },
  {
    name: 'ontime_update_entry',
    description:
      'Update fields of an existing entry (event, milestone, delay or group). Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. If playback is running and rundownId is omitted or matches the loaded rundown, confirm the user intends to change the live rundown before calling. Only provided fields are changed. Event time fields (timeStart, timeEnd, duration) are reconciled server-side — you may provide any combination. Group fields: title, note, colour, custom, targetDuration. Delay field: duration. Milestone fields: cue, title, note, colour, custom. Custom values must use existing project custom field keys; adding a new custom field is a separate operation.',
    inputSchema: z.toJSONSchema(schemas.updateEntrySchema),
    annotations: WRITE_DESTRUCTIVE,
  },
  {
    name: 'ontime_delete_entries',
    description:
      'Delete one or more entries (events, milestones, delays, or groups). Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it.',
    inputSchema: z.toJSONSchema(schemas.deleteEntriesSchema),
    annotations: WRITE_DESTRUCTIVE,
  },
  {
    name: 'ontime_reorder_entry',
    description:
      'Move an entry to a new position relative to another entry. Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. Use before/after for sibling reordering; use insert for targeted moves into a group. For grouping several existing top-level entries, prefer ontime_group_entries.',
    inputSchema: z.toJSONSchema(schemas.reorderEntrySchema),
    annotations: WRITE_IDEM,
  },
  {
    name: 'ontime_group_entries',
    description:
      'Create a group from existing top-level entries. Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. If playback is running and rundownId is omitted or matches the loaded rundown, confirm the user intends to change the live rundown before calling. Entries must be existing top-level non-group entries; groups cannot be nested. Optional title, note, colour, custom, and targetDuration are applied to the created group.',
    inputSchema: z.toJSONSchema(schemas.groupEntriesSchema),
    annotations: WRITE,
  },
  {
    name: 'ontime_ungroup_entry',
    description:
      'Dissolve a group by moving its children to the top level where the group was. Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. If playback is running and rundownId is omitted or matches the loaded rundown, confirm the user intends to change the live rundown before calling.',
    inputSchema: z.toJSONSchema(schemas.ungroupEntrySchema),
    annotations: WRITE_DESTRUCTIVE,
  },
  {
    name: 'ontime_batch_create_entries',
    description:
      'Create multiple entries, including groups with nested children. Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. If playback is running and rundownId is omitted or matches the loaded rundown, confirm the user intends to change the live rundown before calling. Use this for "build from agenda" flows to avoid many round trips. Entries are inserted in array order; if `after` is provided it positions the first top-level entry, subsequent top-level entries chain from the previous. A group entry may include `children`; those entries are created inside the group in array order. Groups cannot be nested. For events, provide title plus enough timing data for Ontime to infer a strategy: timeStart+duration calculates timeEnd, timeStart+timeEnd calculates duration and locks end, timeEnd+duration calculates timeStart, and all three prioritise duration.',
    inputSchema: z.toJSONSchema(schemas.batchCreateEntriesSchema),
    annotations: WRITE,
  },
  {
    name: 'ontime_batch_update_entries',
    description:
      'Apply the same field values to multiple entries by ID. Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. Use for bulk operations like recolouring all keynotes, skipping all breaks, or setting the same custom value on several entries. Custom values must use existing project custom field keys. Do not use for changes where each entry needs a different value, such as time shifts with different timeStart/timeEnd values; compute those per entry and call ontime_update_entry for each.',
    inputSchema: z.toJSONSchema(schemas.batchUpdateEntriesSchema),
    annotations: WRITE_DESTRUCTIVE,
  },
  // --- Rundown management ---
  {
    name: 'ontime_list_rundowns',
    description:
      'List all rundowns in the current project. Returns rundown IDs and titles, plus the ID of the currently loaded one.',
    inputSchema: z.toJSONSchema(schemas.listRundownsSchema),
    annotations: READ,
  },
  {
    name: 'ontime_create_rundown',
    description:
      'Create a new empty rundown in the current project. Does not switch to it — use ontime_load_rundown to activate.',
    inputSchema: z.toJSONSchema(schemas.createRundownSchema),
    annotations: WRITE,
  },
  {
    name: 'ontime_load_rundown',
    description:
      'Make a rundown the active rundown. This resets the runtime and clears playback state. If playback is running, confirm the user accepts interrupting the live rundown before calling. To edit a background rundown without interrupting playback, advise using the cuesheet view.',
    inputSchema: z.toJSONSchema(schemas.loadRundownSchema),
    annotations: WRITE_DESTRUCTIVE,
  },
  {
    name: 'ontime_rename_rundown',
    description: 'Rename an existing rundown',
    inputSchema: z.toJSONSchema(schemas.renameRundownSchema),
    annotations: WRITE_IDEM,
  },
  {
    name: 'ontime_delete_rundown',
    description: 'Delete a rundown (cannot delete the currently loaded rundown or the last remaining rundown)',
    inputSchema: z.toJSONSchema(schemas.deleteRundownSchema),
    annotations: WRITE_DESTRUCTIVE,
  },
  {
    name: 'ontime_duplicate_rundown',
    description: 'Duplicate a rundown, creating a copy with a new ID. Does not switch to the copy.',
    inputSchema: z.toJSONSchema(schemas.duplicateRundownSchema),
    annotations: WRITE,
  },
  // --- Timer & project ---
  {
    name: 'ontime_get_timer_state',
    description:
      'Get the current timer/playback state. Returns: clock (time of day), timer ({ playback, current, elapsed, phase, expectedFinish, addedTime, startedAt }), eventNow (full event object or null), eventNext (full event object or null), offset.',
    inputSchema: z.toJSONSchema(schemas.getTimerStateSchema),
    annotations: READ,
  },
  {
    name: 'ontime_get_project_info',
    description:
      'Get current project metadata: title, description, url, info, logo, and custom header fields (array of { title, value, url }).',
    inputSchema: z.toJSONSchema(schemas.getProjectInfoSchema),
    annotations: READ,
  },
  {
    name: 'ontime_update_project_info',
    description: 'Update project metadata fields. All fields are optional — only provided fields are updated.',
    inputSchema: z.toJSONSchema(schemas.updateProjectInfoSchema),
    annotations: WRITE_DESTRUCTIVE,
  },
  {
    name: 'ontime_get_custom_fields',
    description:
      'Get the project custom field definitions. Returns { [key]: { label, type: "text"|"image", colour } }. Keys are referenced in entry.custom[key].',
    inputSchema: z.toJSONSchema(schemas.getCustomFieldsSchema),
    annotations: READ,
  },
  {
    name: 'ontime_create_custom_field',
    description:
      'Create a new project-level custom field definition. Custom fields add typed columns to every entry in all rundowns. The key is auto-derived from the label (spaces → underscores, e.g. "Camera Angle" → "Camera_Angle"). Creation is non-destructive — check ontime_get_custom_fields for an existing field covering the concept, and if none exists create directly without asking the user. After creation, use the returned key in entry.custom.',
    inputSchema: z.toJSONSchema(schemas.createCustomFieldSchema),
    annotations: WRITE,
  },
  {
    name: 'ontime_update_custom_field',
    description:
      'Update a custom field label or colour. Changing the label renames the derived key (spaces → underscores) and updates all entry references across all rundowns. Field type cannot be changed.',
    inputSchema: z.toJSONSchema(schemas.updateCustomFieldSchema),
    annotations: WRITE_IDEM,
  },
  {
    name: 'ontime_delete_custom_field',
    description:
      'Delete a custom field definition and remove its values from all entries in all rundowns. Destructive and cannot be undone — confirm with the user before calling.',
    inputSchema: z.toJSONSchema(schemas.deleteCustomFieldSchema),
    annotations: WRITE_DESTRUCTIVE,
  },
  // --- Project file management ---
  {
    name: 'ontime_list_projects',
    description: 'List all project files on disk. Returns filenames, timestamps, and the last-loaded project name.',
    inputSchema: z.toJSONSchema(schemas.listProjectsSchema),
    annotations: READ,
  },
  {
    name: 'ontime_load_project',
    description:
      'Load a different project file by filename. This swaps the database and reinitialises runtime. If playback is running, confirm the user accepts interrupting the live project before calling.',
    inputSchema: z.toJSONSchema(schemas.loadProjectSchema),
    annotations: WRITE_DESTRUCTIVE,
  },
  {
    name: 'ontime_create_project',
    description:
      'Create a new project file and switch to it. This swaps the loaded project. If playback is running, confirm the user accepts interrupting the live project before calling. Omit the .json extension — Ontime appends it.',
    inputSchema: z.toJSONSchema(schemas.createProjectSchema),
    annotations: WRITE_DESTRUCTIVE,
  },
  {
    name: 'ontime_rename_project',
    description: 'Rename a project file. If the renamed project is currently loaded, it is reloaded with the new name.',
    inputSchema: z.toJSONSchema(schemas.renameProjectSchema),
    annotations: WRITE_IDEM,
  },
  {
    name: 'ontime_duplicate_project',
    description: 'Duplicate a project file on disk with a new filename. Does not switch to the copy.',
    inputSchema: z.toJSONSchema(schemas.duplicateProjectSchema),
    annotations: WRITE,
  },
  {
    name: 'ontime_delete_project',
    description: 'Delete a project file from disk. Fails if the file is currently loaded.',
    inputSchema: z.toJSONSchema(schemas.deleteProjectSchema),
    annotations: WRITE_DESTRUCTIVE,
  },
] as const;

type ToolName = (typeof TOOL_DEFINITIONS)[number]['name'];

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
    const targetArgs = parseArgs(schemas.getRundownSchema, args);
    const rundown = getRundownById(targetArgs.rundownId);
    const data = { order: rundown.order, entries: rundown.entries };
    const serialised = text(data);
    if (serialised.length > CHARACTER_LIMIT) {
      return ok({
        warning: `Rundown too large (${serialised.length} chars) — fetch individual entries with ontime_get_entry.`,
        truncated: true,
        rundownId: rundown.id,
        order: rundown.order,
      });
    }
    return ok({ rundownId: rundown.id, ...data });
  },

  ontime_get_rundown_metadata: async () => ok(getRundownMetadata()),

  ontime_get_entry: async (args) => {
    const entryArgs = parseArgs(schemas.getEntrySchema, args);
    const entry = findEntry(entryArgs);
    if (entry) return ok(entry);
    if (entryArgs.id) return err(`No entry with id ${entryArgs.id}`);
    if (entryArgs.cue) return err(`No entry with cue ${entryArgs.cue}`);
    return err('Provide id or cue');
  },

  ontime_create_entry: async (args) => {
    return ok(await createEntryForMcp(parseArgs(schemas.createEntrySchema, args)));
  },

  ontime_update_entry: async (args) => {
    return ok(await updateEntryForMcp(parseArgs(schemas.updateEntrySchema, args)));
  },

  ontime_delete_entries: async (args) => {
    return ok(await deleteEntriesForMcp(parseArgs(schemas.deleteEntriesSchema, args)));
  },

  ontime_reorder_entry: async (args) => {
    return ok(await reorderEntryForMcp(parseArgs(schemas.reorderEntrySchema, args)));
  },

  ontime_group_entries: async (args) => {
    return ok(await groupEntriesForMcp(parseArgs(schemas.groupEntriesSchema, args)));
  },

  ontime_ungroup_entry: async (args) => {
    return ok(await ungroupEntryForMcp(parseArgs(schemas.ungroupEntrySchema, args)));
  },

  ontime_batch_create_entries: async (args) => {
    return ok(await batchCreateEntriesForMcp(parseArgs(schemas.batchCreateEntriesSchema, args)));
  },

  ontime_batch_update_entries: async (args) => {
    return ok(await batchUpdateEntriesForMcp(parseArgs(schemas.batchUpdateEntriesSchema, args)));
  },

  ontime_list_rundowns: async () => ok(toRundownList(getDataProvider().getProjectRundowns())),

  ontime_create_rundown: async (args) => {
    const { title } = parseArgs(schemas.createRundownSchema, args);
    return ok(toRundownList(await createNewRundown(title)));
  },

  ontime_load_rundown: async (args) => {
    const { id } = parseArgs(schemas.loadRundownSchema, args);
    return ok(toRundownList(await loadRundown(id)));
  },

  ontime_rename_rundown: async (args) => {
    const { id, title } = parseArgs(schemas.renameRundownSchema, args);
    return ok(toRundownList(await renameRundown(id, title)));
  },

  ontime_delete_rundown: async (args) => {
    const { id } = parseArgs(schemas.deleteRundownSchema, args);
    return ok(toRundownList(await deleteRundown(id)));
  },

  ontime_duplicate_rundown: async (args) => {
    const { id } = parseArgs(schemas.duplicateRundownSchema, args);
    return ok(toRundownList(await duplicateExistingRundown(id)));
  },

  ontime_get_timer_state: async () => {
    const { clock, timer, eventNow, eventNext, offset } = getState();
    return ok({ clock, timer, eventNow, eventNext, offset });
  },

  ontime_get_project_info: async () => ok(getProjectData()),

  ontime_update_project_info: async (args) => {
    const updated = await editCurrentProjectData(parseArgs(schemas.updateProjectInfoSchema, args));
    return ok(updated);
  },

  ontime_get_custom_fields: async () => ok(getProjectCustomFields()),

  ontime_create_custom_field: async (args) => {
    return ok(await createCustomFieldForMcp(parseArgs(schemas.createCustomFieldSchema, args)));
  },

  ontime_update_custom_field: async (args) => {
    return ok(await updateCustomFieldForMcp(parseArgs(schemas.updateCustomFieldSchema, args)));
  },

  ontime_delete_custom_field: async (args) => {
    return ok(await deleteCustomFieldForMcp(parseArgs(schemas.deleteCustomFieldSchema, args)));
  },

  ontime_list_projects: async () => ok(await getProjectList()),

  ontime_load_project: async (args) => {
    const { filename } = parseArgs(schemas.loadProjectSchema, args);
    await loadProjectFile(filename);
    return ok(await getProjectList());
  },

  ontime_create_project: async (args) => {
    const { filename, title = '', description = '' } = parseArgs(schemas.createProjectSchema, args);
    const project: ProjectData = { ...makeNewProject().project, title, description };
    const newFileName = await createProjectWithPatch(filename, { project });
    return ok({ filename: newFileName });
  },

  ontime_rename_project: async (args) => {
    const { filename, newFilename } = parseArgs(schemas.renameProjectSchema, args);
    await renameProjectFile(filename, newFilename);
    return ok(await getProjectList());
  },

  ontime_duplicate_project: async (args) => {
    const { filename, newFilename } = parseArgs(schemas.duplicateProjectSchema, args);
    await duplicateProjectFile(filename, newFilename);
    return ok(await getProjectList());
  },

  ontime_delete_project: async (args) => {
    const { filename } = parseArgs(schemas.deleteProjectSchema, args);
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
