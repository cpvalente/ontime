import { ProjectData, SupportedEntry } from 'ontime-types';
import sanitize from 'sanitize-filename';
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
import { ensureJsonExtension } from '../utils/fileManagement.js';
import { buildToolList, defineTool, err, makeToolRegistry, ok } from './mcp.registry.js';
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

// ---- Shared field schemas ----

/** Tools which take no arguments still reject anything an agent sends them */
const NO_ARGUMENTS = z.strictObject({});

const ENTRY_TIME_FIELDS = {
  timeStart: z.number().optional().describe('Event start time in ms from midnight (e.g. 09:00 = 32400000)'),
  timeEnd: z.number().optional().describe('Event end time in ms from midnight'),
  duration: z
    .number()
    .optional()
    .describe('Duration in ms (events: should equal timeEnd - timeStart; delays: the schedule shift)'),
  targetDuration: z.number().optional().describe('Groups only: planned length of the group in ms'),
};

const ENTRY_TYPE_FIELD = z
  .enum(SupportedEntry)
  .optional()
  .describe(
    'Entry type, defaults to event. event: timed show item; milestone: non-timed marker; delay: schedule shift; group: named container of entries',
  );

/** Insert anchors accept an entry ID, or `true` to append / prepend */
const insertAnchor = (description: string) =>
  z
    .union([z.string(), z.literal(true)])
    .optional()
    .describe(description);

const GROUP_FIELDS = {
  title: z.string().optional().describe('Group title shown in the rundown and views'),
  note: z.string().optional().describe('Free-text group note for production notes or references'),
  colour: z
    .string()
    .optional()
    .describe('Hex colour (#RRGGBB) for the group — prefer the default Ontime palette from ontime://style-guide'),
  custom: z
    .record(z.string(), z.string())
    .optional()
    .describe('Custom field values keyed by existing project field key'),
  targetDuration: z.number().optional().describe('Planned length of the group in ms'),
};

/**
 * Project filenames reach the filesystem through `join(projectsDir, name)`, so they are
 * confined here the same way the HTTP routes confine them in db.validation.ts.
 */
const projectFilename = (description: string) =>
  z
    .string()
    .trim()
    .min(1)
    .transform((filename) => ensureJsonExtension(sanitize(filename)))
    .refine((filename) => filename.length > 1, 'Filename is empty once sanitised')
    .describe(description);

/** ontime_create_project takes a name without extension: ProjectService appends it */
const newProjectFilename = z
  .string()
  .trim()
  .min(1)
  .transform((filename) => sanitize(filename))
  .refine((filename) => filename.length > 0, 'Filename is empty once sanitised')
  .describe('Filename without extension, e.g. "my-show"');

// Batch creation is modelled two levels deep rather than recursively: groups cannot be
// nested, so a child can never carry children of its own. This keeps the generated JSON
// Schema free of $ref/$defs, which some MCP clients handle poorly.
const batchChildEntry = z.strictObject({
  type: z
    .enum([SupportedEntry.Event, SupportedEntry.Delay, SupportedEntry.Milestone])
    .optional()
    .describe('Entry type, defaults to event. Nested groups are not supported'),
  ...ENTRY_TIME_FIELDS,
  ...EVENT_WRITABLE_FIELDS,
});

const batchEntry = z.strictObject({
  type: ENTRY_TYPE_FIELD,
  ...ENTRY_TIME_FIELDS,
  children: z
    .array(batchChildEntry)
    .optional()
    .describe(
      'For group entries only: child events, milestones, or delays to create inside this group in order. Nested groups are not supported.',
    ),
  ...EVENT_WRITABLE_FIELDS,
});

// ---- Tool definitions ----
// Each tool declares its input schema next to the handler that consumes it. Handlers are
// thin translation wrappers: they map validated arguments to a call into an existing
// service and format the response. Business logic belongs in the services.
export const TOOLS = [
  // --- Rundown read ---
  defineTool(
    'ontime_get_rundown',
    {
      description:
        'Get a rundown. Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to read a background rundown. Returns { order: EntryId[], entries: { [id]: OntimeEntry } }. If the rundown exceeds 25 000 chars, returns only the order array with a warning — fetch individual entries with ontime_get_entry.',
      inputSchema: z.strictObject({ ...RUNDOWN_TARGET_FIELD }),
      annotations: READ,
    },
    async (args) => {
      const rundown = getRundownById(args.rundownId);
      const data = { order: rundown.order, entries: rundown.entries };
      const serialised = JSON.stringify(data);
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
  ),

  defineTool(
    'ontime_get_rundown_metadata',
    {
      description:
        'Get cached metadata for the current rundown. Returns: totalDelay, totalDuration, totalDays, firstStart, lastEnd, flags (flagged entry IDs), playableEventOrder, timedEventOrder, flatEntryOrder.',
      inputSchema: NO_ARGUMENTS,
      annotations: READ,
    },
    async () => ok(getRundownMetadata()),
  ),

  defineTool(
    'ontime_get_entry',
    {
      description:
        'Get a single entry by id or cue. Provide either id or cue (not both). Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to read a background rundown. Returns the full entry object.',
      inputSchema: z
        .strictObject({
          ...RUNDOWN_TARGET_FIELD,
          id: z.string().optional().describe('Entry ID (from rundown.entries key or entry.id)'),
          cue: z.string().optional().describe('Human-facing cue label'),
        })
        .refine((args) => args.id !== undefined || args.cue !== undefined, 'Provide id or cue'),
      annotations: READ,
    },
    async (args) => {
      const entry = findEntry(args);
      if (entry) return ok(entry);
      if (args.id) return err(`No entry with id ${args.id}`);
      return err(`No entry with cue ${args.cue}`);
    },
  ),

  // --- Rundown mutations ---
  defineTool(
    'ontime_create_entry',
    {
      description:
        'Create a new entry. Omit after/before to append at the end, use after: true to explicitly append, use before: true to prepend, or use before/after with an entry ID to position the entry. Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. If playback is running and rundownId is omitted or matches the loaded rundown, confirm the user intends to change the live rundown before calling. For type "event" provide title plus enough timing data for Ontime to infer a strategy: timeStart+duration calculates timeEnd, timeStart+timeEnd calculates duration and locks end, timeEnd+duration calculates timeStart, and all three prioritise duration. For "milestone" provide cue/title/note/colour and optional custom values using existing project custom field keys. For "delay" provide duration. For "group" provide title plus optional note/colour/custom/targetDuration.',
      inputSchema: z.strictObject({
        ...RUNDOWN_TARGET_FIELD,
        type: ENTRY_TYPE_FIELD,
        ...ENTRY_TIME_FIELDS,
        after: insertAnchor('Insert after this entry ID, or true to append'),
        before: insertAnchor('Insert before this entry ID, or true to prepend'),
        ...EVENT_WRITABLE_FIELDS,
      }),
      annotations: WRITE,
    },
    async (args) => ok(await createEntryForMcp(args)),
  ),

  defineTool(
    'ontime_update_entry',
    {
      description:
        'Update fields of an existing entry (event, milestone, delay or group). Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. If playback is running and rundownId is omitted or matches the loaded rundown, confirm the user intends to change the live rundown before calling. Only provided fields are changed. Event time fields (timeStart, timeEnd, duration) are reconciled server-side — you may provide any combination. Group fields: title, note, colour, custom, targetDuration. Delay field: duration. Milestone fields: cue, title, note, colour, custom. Custom values must use existing project custom field keys; adding a new custom field is a separate operation.',
      inputSchema: z.strictObject({
        ...RUNDOWN_TARGET_FIELD,
        id: z.string().describe('ID of the entry to update'),
        ...ENTRY_TIME_FIELDS,
        ...EVENT_WRITABLE_FIELDS,
      }),
      annotations: WRITE_DESTRUCTIVE,
    },
    async (args) => ok(await updateEntryForMcp(args)),
  ),

  defineTool(
    'ontime_delete_entries',
    {
      description:
        'Delete one or more entries (events, milestones, delays, or groups). Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it.',
      inputSchema: z.strictObject({
        ...RUNDOWN_TARGET_FIELD,
        ids: z.array(z.string()).describe('Array of entry IDs to delete'),
      }),
      annotations: WRITE_DESTRUCTIVE,
    },
    async (args) => ok(await deleteEntriesForMcp(args)),
  ),

  defineTool(
    'ontime_reorder_entry',
    {
      description:
        'Move an entry to a new position relative to another entry. Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. Use before/after for sibling reordering; use insert for targeted moves into a group. For grouping several existing top-level entries, prefer ontime_group_entries.',
      inputSchema: z.strictObject({
        ...RUNDOWN_TARGET_FIELD,
        entryId: z.string().describe('ID of the entry to move'),
        destinationId: z.string().describe('ID of the target entry (sibling or parent group)'),
        order: z
          .enum(['before', 'after', 'insert'])
          .describe('before/after: place as sibling; insert: place inside a group'),
      }),
      annotations: WRITE_IDEM,
    },
    async (args) => ok(await reorderEntryForMcp(args)),
  ),

  defineTool(
    'ontime_group_entries',
    {
      description:
        'Create a group from existing top-level entries. Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. If playback is running and rundownId is omitted or matches the loaded rundown, confirm the user intends to change the live rundown before calling. Entries must be existing top-level non-group entries; groups cannot be nested. Optional title, note, colour, custom, and targetDuration are applied to the created group.',
      inputSchema: z.strictObject({
        ...RUNDOWN_TARGET_FIELD,
        ids: z
          .array(z.string())
          .nonempty('Provide at least one entry ID to group.')
          .describe('Existing top-level entry IDs to group'),
        ...GROUP_FIELDS,
      }),
      annotations: WRITE,
    },
    async (args) => ok(await groupEntriesForMcp(args)),
  ),

  defineTool(
    'ontime_ungroup_entry',
    {
      description:
        'Dissolve a group by moving its children to the top level where the group was. Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. If playback is running and rundownId is omitted or matches the loaded rundown, confirm the user intends to change the live rundown before calling.',
      inputSchema: z.strictObject({
        ...RUNDOWN_TARGET_FIELD,
        id: z.string().describe('Group entry ID to dissolve'),
      }),
      annotations: WRITE_DESTRUCTIVE,
    },
    async (args) => ok(await ungroupEntryForMcp(args)),
  ),

  defineTool(
    'ontime_batch_create_entries',
    {
      description:
        'Create multiple entries, including groups with nested children. Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. If playback is running and rundownId is omitted or matches the loaded rundown, confirm the user intends to change the live rundown before calling. Use this for "build from agenda" flows to avoid many round trips. Entries are inserted in array order; omit after/before to append the first entry at the end, use after: true to explicitly append, use before: true to prepend, or use after/before with an entry ID to position the first top-level entry. Subsequent top-level entries chain from the previous. A group entry may include `children`; those entries are created inside the group in array order. Groups cannot be nested. For events, provide title plus enough timing data for Ontime to infer a strategy: timeStart+duration calculates timeEnd, timeStart+timeEnd calculates duration and locks end, timeEnd+duration calculates timeStart, and all three prioritise duration.',
      inputSchema: z.strictObject({
        ...RUNDOWN_TARGET_FIELD,
        after: insertAnchor('Insert the first entry after this entry ID, or true to append'),
        before: insertAnchor('Insert the first entry before this entry ID, or true to prepend'),
        entries: z
          .array(
            batchEntry.refine(
              (entry) => !entry.children?.length || entry.type === SupportedEntry.Group,
              'Only group entries can have children.',
            ),
          )
          .describe('Array of entries to create, in desired order'),
      }),
      annotations: WRITE,
    },
    async (args) => ok(await batchCreateEntriesForMcp(args)),
  ),

  defineTool(
    'ontime_batch_update_entries',
    {
      description:
        'Apply the same field values to multiple entries by ID. Omit rundownId for the currently loaded live rundown, or provide a rundownId from ontime_list_rundowns to edit a background rundown without loading it. Use for bulk operations like recolouring all keynotes, skipping all breaks, or setting the same custom value on several entries. Custom values must use existing project custom field keys. Do not use for changes where each entry needs a different value, such as time shifts with different timeStart/timeEnd values; compute those per entry and call ontime_update_entry for each.',
      inputSchema: z.strictObject({
        ...RUNDOWN_TARGET_FIELD,
        ids: z.array(z.string()).describe('Array of entry IDs to update'),
        data: z
          .strictObject({ ...ENTRY_TIME_FIELDS, ...EVENT_WRITABLE_FIELDS })
          .describe('Partial entry fields to apply to every ID'),
      }),
      annotations: WRITE_DESTRUCTIVE,
    },
    async (args) => ok(await batchUpdateEntriesForMcp(args)),
  ),

  // --- Rundown management ---
  defineTool(
    'ontime_list_rundowns',
    {
      description:
        'List all rundowns in the current project. Returns rundown IDs and titles, plus the ID of the currently loaded one.',
      inputSchema: NO_ARGUMENTS,
      annotations: READ,
    },
    async () => ok(toRundownList(getDataProvider().getProjectRundowns())),
  ),

  defineTool(
    'ontime_create_rundown',
    {
      description:
        'Create a new empty rundown in the current project. Does not switch to it — use ontime_load_rundown to activate.',
      inputSchema: z.strictObject({ title: z.string().describe('Title for the new rundown') }),
      annotations: WRITE,
    },
    async ({ title }) => ok(toRundownList(await createNewRundown(title))),
  ),

  defineTool(
    'ontime_load_rundown',
    {
      description:
        'Make a rundown the active rundown. This resets the runtime and clears playback state. If playback is running, confirm the user accepts interrupting the live rundown before calling. To edit a background rundown without interrupting playback, advise using the cuesheet view.',
      inputSchema: z.strictObject({ id: z.string().describe('Rundown ID to load') }),
      annotations: WRITE_DESTRUCTIVE,
    },
    async ({ id }) => ok(toRundownList(await loadRundown(id))),
  ),

  defineTool(
    'ontime_rename_rundown',
    {
      description: 'Rename an existing rundown',
      inputSchema: z.strictObject({
        id: z.string().describe('Rundown ID to rename'),
        title: z.string().describe('New title'),
      }),
      annotations: WRITE_IDEM,
    },
    async ({ id, title }) => ok(toRundownList(await renameRundown(id, title))),
  ),

  defineTool(
    'ontime_delete_rundown',
    {
      description: 'Delete a rundown (cannot delete the currently loaded rundown or the last remaining rundown)',
      inputSchema: z.strictObject({ id: z.string().describe('Rundown ID to delete') }),
      annotations: WRITE_DESTRUCTIVE,
    },
    async ({ id }) => ok(toRundownList(await deleteRundown(id))),
  ),

  defineTool(
    'ontime_duplicate_rundown',
    {
      description: 'Duplicate a rundown, creating a copy with a new ID. Does not switch to the copy.',
      inputSchema: z.strictObject({ id: z.string().describe('Rundown ID to duplicate') }),
      annotations: WRITE,
    },
    async ({ id }) => ok(toRundownList(await duplicateExistingRundown(id))),
  ),

  // --- Timer & project ---
  defineTool(
    'ontime_get_timer_state',
    {
      description:
        'Get the current timer/playback state. Returns: clock (time of day), timer ({ playback, current, elapsed, phase, expectedFinish, addedTime, startedAt }), eventNow (full event object or null), eventNext (full event object or null), offset.',
      inputSchema: NO_ARGUMENTS,
      annotations: READ,
    },
    async () => {
      const { clock, timer, eventNow, eventNext, offset } = getState();
      return ok({ clock, timer, eventNow, eventNext, offset });
    },
  ),

  defineTool(
    'ontime_get_project_info',
    {
      description:
        'Get current project metadata: title, description, url, info, logo, and custom header fields (array of { title, value, url }).',
      inputSchema: NO_ARGUMENTS,
      annotations: READ,
    },
    async () => ok(getProjectData()),
  ),

  defineTool(
    'ontime_update_project_info',
    {
      description: 'Update project metadata fields. All fields are optional — only provided fields are updated.',
      inputSchema: z.strictObject({
        title: z.string().optional().describe('Project title'),
        description: z.string().optional().describe('Project description'),
        url: z.string().optional().describe('URL shown on viewer pages'),
        info: z.string().optional().describe('Info text shown on viewer pages'),
      }),
      annotations: WRITE_DESTRUCTIVE,
    },
    async (args) => ok(await editCurrentProjectData(args)),
  ),

  defineTool(
    'ontime_get_custom_fields',
    {
      description:
        'Get the project custom field definitions. Returns { [key]: { label, type: "text"|"image", colour } }. Keys are referenced in entry.custom[key].',
      inputSchema: NO_ARGUMENTS,
      annotations: READ,
    },
    async () => ok(getProjectCustomFields()),
  ),

  defineTool(
    'ontime_create_custom_field',
    {
      description:
        'Create a new project-level custom field definition. Custom fields add typed columns to every entry in all rundowns. The key is auto-derived from the label (spaces → underscores, e.g. "Camera Angle" → "Camera_Angle"). Creation is non-destructive — check ontime_get_custom_fields for an existing field covering the concept, and if none exists create directly without asking the user. After creation, use the returned key in entry.custom.',
      inputSchema: z.strictObject({
        label: z
          .string()
          .describe(
            'Human-readable label (letters, numbers and spaces, e.g. "Camera"). Determines the key. Reuse an existing field over creating near-duplicates like "Cam", "camera", "Cameras".',
          ),
        type: z
          .enum(['text', 'image'])
          .describe(
            'Field type — cannot be changed after creation. Use "text" for short text values; "image" for image URLs.',
          ),
        colour: z
          .string()
          .describe(
            'Hex colour (#RRGGBB) used to visually identify this column in the cuesheet — for department fields, match the department colour convention (see ontime://style-guide).',
          ),
      }),
      annotations: WRITE,
    },
    async (args) => ok(await createCustomFieldForMcp(args)),
  ),

  defineTool(
    'ontime_update_custom_field',
    {
      description:
        'Update a custom field label or colour. Changing the label renames the derived key (spaces → underscores) and updates all entry references across all rundowns. Field type cannot be changed.',
      inputSchema: z.strictObject({
        key: z.string().describe('Current field key (from ontime_get_custom_fields)'),
        label: z
          .string()
          .optional()
          .describe('New human-readable label (optional). Changes the derived key and cascades to all entries.'),
        colour: z.string().optional().describe('New hex colour (#RRGGBB) (optional)'),
      }),
      annotations: WRITE_IDEM,
    },
    async (args) => ok(await updateCustomFieldForMcp(args)),
  ),

  defineTool(
    'ontime_delete_custom_field',
    {
      description:
        'Delete a custom field definition and remove its values from all entries in all rundowns. Destructive and cannot be undone — confirm with the user before calling.',
      inputSchema: z.strictObject({
        key: z.string().describe('Field key to delete (from ontime_get_custom_fields)'),
      }),
      annotations: WRITE_DESTRUCTIVE,
    },
    async (args) => ok(await deleteCustomFieldForMcp(args)),
  ),

  // --- Project file management ---
  defineTool(
    'ontime_list_projects',
    {
      description: 'List all project files on disk. Returns filenames, timestamps, and the last-loaded project name.',
      inputSchema: NO_ARGUMENTS,
      annotations: READ,
    },
    async () => ok(await getProjectList()),
  ),

  defineTool(
    'ontime_load_project',
    {
      description:
        'Load a different project file by filename. This swaps the database and reinitialises runtime. If playback is running, confirm the user accepts interrupting the live project before calling.',
      inputSchema: z.strictObject({
        filename: projectFilename('Project filename, e.g. "my-show.json"'),
      }),
      annotations: WRITE_DESTRUCTIVE,
    },
    async ({ filename }) => {
      await loadProjectFile(filename);
      return ok(await getProjectList());
    },
  ),

  defineTool(
    'ontime_create_project',
    {
      description:
        'Create a new project file and switch to it. This swaps the loaded project. If playback is running, confirm the user accepts interrupting the live project before calling. Omit the .json extension — Ontime appends it.',
      inputSchema: z.strictObject({
        filename: newProjectFilename,
        title: z.string().optional().describe('Optional project title'),
        description: z.string().optional().describe('Optional project description'),
      }),
      annotations: WRITE_DESTRUCTIVE,
    },
    async ({ filename, title = '', description = '' }) => {
      const project: ProjectData = { ...makeNewProject().project, title, description };
      const newFileName = await createProjectWithPatch(filename, { project });
      return ok({ filename: newFileName });
    },
  ),

  defineTool(
    'ontime_rename_project',
    {
      description:
        'Rename a project file. If the renamed project is currently loaded, it is reloaded with the new name.',
      inputSchema: z.strictObject({
        filename: projectFilename('Current filename (with .json extension)'),
        newFilename: projectFilename('New filename (with .json extension)'),
      }),
      annotations: WRITE_IDEM,
    },
    async ({ filename, newFilename }) => {
      await renameProjectFile(filename, newFilename);
      return ok(await getProjectList());
    },
  ),

  defineTool(
    'ontime_duplicate_project',
    {
      description: 'Duplicate a project file on disk with a new filename. Does not switch to the copy.',
      inputSchema: z.strictObject({
        filename: projectFilename('Source filename to copy (with .json extension)'),
        newFilename: projectFilename('Filename of the new copy (with .json extension)'),
      }),
      annotations: WRITE,
    },
    async ({ filename, newFilename }) => {
      await duplicateProjectFile(filename, newFilename);
      return ok(await getProjectList());
    },
  ),

  defineTool(
    'ontime_delete_project',
    {
      description: 'Delete a project file from disk. Fails if the file is currently loaded.',
      inputSchema: z.strictObject({
        filename: projectFilename('Project filename to delete (with .json extension)'),
      }),
      annotations: WRITE_DESTRUCTIVE,
    },
    async ({ filename }) => {
      await deleteProjectFile(filename);
      return ok(await getProjectList());
    },
  ),
];

/** Generated once: a new Server instance is created for every MCP request */
export const TOOL_LIST = buildToolList(TOOLS);

export const handleToolCall = makeToolRegistry(TOOLS);
