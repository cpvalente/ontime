/**
 * Zod schemas for MCP tool inputs.
 *
 * Each schema is the single source of truth for three things:
 * - the generated `inputSchema` served to MCP clients (via z.toJSONSchema in mcp.tools.ts)
 * - runtime validation of incoming tool-call arguments (via .safeParse in mcp.tools.ts)
 * - the TypeScript types used by mcp.service.ts's business logic
 *
 * Field shapes intentionally mirror the hand-written JSON Schema this file replaces, not
 * the full canonical domain types in ontime-types — e.g. `colour` stays a plain string,
 * matching what was (not) validated before this migration.
 */
import { z } from 'zod';

import { EVENT_WRITABLE_FIELDS, RUNDOWN_TARGET_FIELD } from './mcp.schema.js';

// ---- Shared fragments ----

const entryTimingFields = {
  timeStart: z.number().optional().describe('Start time in ms from midnight'),
  timeEnd: z.number().optional().describe('End time in ms from midnight'),
  duration: z.number().optional().describe('Duration in ms'),
  targetDuration: z.number().optional().describe('Groups only: planned length of the group in ms'),
};

// All writable fields of any entry type, flattened — reused as the base for create/update/
// batch schemas via .extend(). Matches the previous EntryFieldArgs shape.
const entryFieldsSchema = z.object({ ...entryTimingFields, ...EVENT_WRITABLE_FIELDS });
export type EntryFieldArgs = z.infer<typeof entryFieldsSchema>;

const groupWritableFields = {
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

// ---- Rundown read ----

export const getRundownSchema = z.object({ ...RUNDOWN_TARGET_FIELD });
export const getRundownMetadataSchema = z.object({});
export const getEntrySchema = z.object({
  ...RUNDOWN_TARGET_FIELD,
  id: z.string().optional().describe('Entry ID (from rundown.entries key or entry.id)'),
  cue: z.string().optional().describe('Human-facing cue label'),
});

// ---- Rundown mutations ----

export const createEntrySchema = entryFieldsSchema.extend({
  ...RUNDOWN_TARGET_FIELD,
  type: z
    .enum(['event', 'delay', 'milestone', 'group'])
    .optional()
    .describe(
      'Entry type, defaults to event. event: timed show item; milestone: non-timed marker; delay: schedule shift; group: named container of entries',
    ),
  // Overrides entryFieldsSchema's generic timing descriptions with create-specific guidance.
  timeStart: z.number().optional().describe('Event start time in ms from midnight (e.g. 09:00 = 32400000)'),
  timeEnd: z.number().optional().describe('Event end time in ms from midnight'),
  duration: z
    .number()
    .optional()
    .describe('Duration in ms (events: should equal timeEnd - timeStart; delays: the schedule shift)'),
  after: z.string().optional().describe('Insert after this entry ID'),
  before: z.string().optional().describe('Insert before this entry ID'),
});

export const updateEntrySchema = entryFieldsSchema.extend({
  ...RUNDOWN_TARGET_FIELD,
  id: z.string().describe('ID of the entry to update'),
});

export const deleteEntriesSchema = z.object({
  ...RUNDOWN_TARGET_FIELD,
  ids: z.array(z.string()).describe('Array of entry IDs to delete'),
});

export const reorderEntrySchema = z.object({
  ...RUNDOWN_TARGET_FIELD,
  entryId: z.string().describe('ID of the entry to move'),
  destinationId: z.string().describe('ID of the target entry (sibling or parent group)'),
  order: z.enum(['before', 'after', 'insert']).describe('before/after: place as sibling; insert: place inside a group'),
});

export const groupEntriesSchema = z.object({
  ...RUNDOWN_TARGET_FIELD,
  ids: z.array(z.string()).describe('Existing top-level entry IDs to group'),
  ...groupWritableFields,
});

export const ungroupEntrySchema = z.object({
  ...RUNDOWN_TARGET_FIELD,
  id: z.string().describe('Group entry ID to dissolve'),
});

// Recursive: a group entry in a batch may include `children` of the same shape. `type`/
// `children` are declared outside entryFieldsSchema so the lazy() wrapper can reference
// the schema being defined.
export interface BatchCreateEntryArgs extends EntryFieldArgs {
  type?: 'event' | 'delay' | 'milestone' | 'group';
  children?: BatchCreateEntryArgs[];
}

export const batchCreateEntrySchema: z.ZodType<BatchCreateEntryArgs> = z.lazy(() =>
  entryFieldsSchema.extend({
    type: z.enum(['event', 'delay', 'milestone', 'group']).optional().describe('Entry type, defaults to event'),
    children: z
      .array(batchCreateEntrySchema)
      .optional()
      .describe(
        'For group entries only: child events, milestones, or delays to create inside this group in order. Nested groups are not supported.',
      ),
  }),
);

export const batchCreateEntriesSchema = z.object({
  ...RUNDOWN_TARGET_FIELD,
  after: z.string().optional().describe('Insert the first entry after this entry ID'),
  entries: z.array(batchCreateEntrySchema).describe('Array of entries to create, in desired order'),
});

export const batchUpdateEntriesSchema = z.object({
  ...RUNDOWN_TARGET_FIELD,
  ids: z.array(z.string()).describe('Array of entry IDs to update'),
  data: entryFieldsSchema.describe('Partial entry fields to apply to every ID'),
});

// ---- Rundown management ----

export const listRundownsSchema = z.object({});
export const createRundownSchema = z.object({ title: z.string().describe('Title for the new rundown') });
export const loadRundownSchema = z.object({ id: z.string().describe('Rundown ID to load') });
export const renameRundownSchema = z.object({
  id: z.string().describe('Rundown ID to rename'),
  title: z.string().describe('New title'),
});
export const deleteRundownSchema = z.object({ id: z.string().describe('Rundown ID to delete') });
export const duplicateRundownSchema = z.object({ id: z.string().describe('Rundown ID to duplicate') });

// ---- Timer & project ----

export const getTimerStateSchema = z.object({});
export const getProjectInfoSchema = z.object({});
export const updateProjectInfoSchema = z.object({
  title: z.string().optional().describe('Project title'),
  description: z.string().optional().describe('Project description'),
  url: z.string().optional().describe('URL shown on viewer pages'),
  info: z.string().optional().describe('Info text shown on viewer pages'),
});
export const getCustomFieldsSchema = z.object({});
export const createCustomFieldSchema = z.object({
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
});
export const updateCustomFieldSchema = z.object({
  key: z.string().describe('Current field key (from ontime_get_custom_fields)'),
  label: z
    .string()
    .optional()
    .describe('New human-readable label (optional). Changes the derived key and cascades to all entries.'),
  colour: z.string().optional().describe('New hex colour (#RRGGBB) (optional)'),
});
export const deleteCustomFieldSchema = z.object({
  key: z.string().describe('Field key to delete (from ontime_get_custom_fields)'),
});

// ---- Project file management ----

export const listProjectsSchema = z.object({});
export const loadProjectSchema = z.object({
  filename: z.string().describe('Project filename, e.g. "my-show.json"'),
});
export const createProjectSchema = z.object({
  filename: z.string().describe('Filename without extension, e.g. "my-show"'),
  title: z.string().optional().describe('Optional project title'),
  description: z.string().optional().describe('Optional project description'),
});
export const renameProjectSchema = z.object({
  filename: z.string().describe('Current filename (with .json extension)'),
  newFilename: z.string().describe('New filename (with .json extension)'),
});
export const duplicateProjectSchema = z.object({
  filename: z.string().describe('Source filename to copy (with .json extension)'),
  newFilename: z.string().describe('Filename of the new copy (with .json extension)'),
});
export const deleteProjectSchema = z.object({
  filename: z.string().describe('Project filename to delete (with .json extension)'),
});

// ---- Inferred types consumed by mcp.service.ts (replaces its hand-written *Args types) ----

export type TargetRundownArgs = z.infer<typeof getRundownSchema>;
export type GetEntryArgs = z.infer<typeof getEntrySchema>;
export type CreateEntryArgs = z.infer<typeof createEntrySchema>;
export type UpdateEntryArgs = z.infer<typeof updateEntrySchema>;
export type DeleteEntriesArgs = z.infer<typeof deleteEntriesSchema>;
export type ReorderEntryArgs = z.infer<typeof reorderEntrySchema>;
export type GroupEntriesArgs = z.infer<typeof groupEntriesSchema>;
export type UngroupEntryArgs = z.infer<typeof ungroupEntrySchema>;
export type BatchCreateEntriesArgs = z.infer<typeof batchCreateEntriesSchema>;
export type BatchUpdateEntriesArgs = z.infer<typeof batchUpdateEntriesSchema>;
export type ProjectInfoArgs = z.infer<typeof updateProjectInfoSchema>;
export type CreateCustomFieldArgs = z.infer<typeof createCustomFieldSchema>;
export type UpdateCustomFieldArgs = z.infer<typeof updateCustomFieldSchema>;
export type DeleteCustomFieldArgs = z.infer<typeof deleteCustomFieldSchema>;
