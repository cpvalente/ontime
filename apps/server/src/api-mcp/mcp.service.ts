import {
  EntryId,
  EventPostPayload,
  OntimeEntry,
  OntimeGroup,
  PatchWithId,
  ProjectRundowns,
  Rundown,
  SupportedEntry,
} from 'ontime-types';
import { checkRegex, customFieldLabelToKey } from 'ontime-utils';

import { getCurrentRundown, getCurrentRundownId, getProjectCustomFields } from '../api-data/rundown/rundown.dao.js';
import {
  addEntry,
  batchEditEntries,
  createCustomField,
  deleteCustomField,
  deleteEntries,
  editCustomField,
  editEntry,
  groupEntries,
  reorderEntry,
  ungroupEntries,
} from '../api-data/rundown/rundown.service.js';
import { normalisedToRundownArray } from '../api-data/rundown/rundown.utils.js';
import { getDataProvider } from '../classes/data-provider/DataProvider.js';
// *Args types are now derived from the Zod schemas in mcp.tools.schema.ts — that file is
// the single source of truth for MCP tool input shape, validation, and typing.
import type {
  BatchCreateEntriesArgs,
  BatchCreateEntryArgs,
  BatchUpdateEntriesArgs,
  CreateCustomFieldArgs,
  CreateEntryArgs,
  DeleteCustomFieldArgs,
  DeleteEntriesArgs,
  EntryFieldArgs,
  GetEntryArgs,
  GroupEntriesArgs,
  ReorderEntryArgs,
  TargetRundownArgs,
  UngroupEntryArgs,
  UpdateCustomFieldArgs,
  UpdateEntryArgs,
} from './mcp.tools.schema.js';

export function resolveTargetRundownId(args: TargetRundownArgs): string {
  return args.rundownId ?? getCurrentRundownId();
}

function getTargetMeta(rundownId: string) {
  const loaded = rundownId === getCurrentRundownId();
  return { rundownId, loaded };
}

export function getRundownById(rundownId?: string): Readonly<Rundown> {
  const targetId = rundownId ?? getCurrentRundownId();
  return targetId === getCurrentRundownId() ? getCurrentRundown() : getDataProvider().getRundown(targetId);
}

export function findEntry(args: GetEntryArgs): OntimeEntry | undefined {
  const rundown = getRundownById(args.rundownId);
  if (args.id) {
    return rundown.entries[args.id];
  }
  if (args.cue) {
    return Object.values(rundown.entries).find((entry) => 'cue' in entry && entry.cue === args.cue);
  }
}

export function toRundownList(projectRundowns: Readonly<ProjectRundowns>) {
  return { loaded: getCurrentRundownId(), rundowns: normalisedToRundownArray(projectRundowns) };
}

export function assertKnownCustomFields(...customValues: Array<EntryFieldArgs['custom'] | undefined>) {
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
    const missing = [...unknownKeys].join(', ');
    const available = Object.keys(customFields);
    const hint =
      available.length > 0 ? `Available keys: ${available.join(', ')}.` : 'No custom fields are defined yet.';

    // keys are case-sensitive; a near-miss on casing is the most common mistake
    const suggestions = [...unknownKeys]
      .map((key) => {
        const match = available.find((existing) => existing.toLowerCase() === key.toLowerCase());
        return match ? `"${key}" → "${match}"` : null;
      })
      .filter(Boolean);
    const caseHint =
      suggestions.length > 0 ? ` Keys are case-sensitive — did you mean: ${suggestions.join(', ')}?` : '';

    throw new Error(
      `Unknown custom field key(s): ${missing}. ${hint}${caseHint} ` +
        `Call ontime_create_custom_field with { label, type, colour } to create a missing field — ` +
        `the key is auto-derived from the label (spaces → underscores, e.g. label "Mix Output" → key "Mix_Output").`,
    );
  }
}

/** Translates tool arguments into the payload consumed by rundown.service addEntry */
export function toEntryPayload(args: CreateEntryArgs): EventPostPayload {
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
      const { type: _type, rundownId: _rundownId, ...eventFields } = args;
      return { type: SupportedEntry.Event, ...eventFields };
    }
    default:
      throw new Error(`Invalid entry type: ${String(type)}`);
  }
}

function toGroupPatch(args: CreateEntryArgs, id: EntryId): PatchWithId<OntimeGroup> | null {
  const patch: PatchWithId<OntimeGroup> = { id };

  if (args.title !== undefined) patch.title = args.title;
  if (args.note !== undefined) patch.note = args.note;
  if (args.colour !== undefined) patch.colour = args.colour;
  if (args.targetDuration !== undefined) patch.targetDuration = args.targetDuration;
  if (args.custom !== undefined) patch.custom = args.custom;

  return Object.keys(patch).length > 1 ? patch : null;
}

async function updateCreatedGroup(rundownId: string, args: CreateEntryArgs, entry: OntimeEntry): Promise<OntimeEntry> {
  if (args.type !== SupportedEntry.Group) {
    return entry;
  }

  const patch = toGroupPatch(args, entry.id);
  if (!patch) {
    return entry;
  }

  return editEntry(rundownId, patch);
}

export async function createEntryForMcp(args: CreateEntryArgs) {
  assertKnownCustomFields(args.custom);
  const rundownId = resolveTargetRundownId(args);
  const createdEntry = await addEntry(rundownId, toEntryPayload(args));
  const entry = await updateCreatedGroup(rundownId, args, createdEntry);
  return { target: getTargetMeta(rundownId), entry };
}

export async function updateEntryForMcp(args: UpdateEntryArgs) {
  assertKnownCustomFields(args.custom);
  const rundownId = resolveTargetRundownId(args);
  const { rundownId: _rundownId, ...patch } = args;
  const entry = await editEntry(rundownId, patch as PatchWithId);
  return { target: getTargetMeta(rundownId), entry };
}

export async function deleteEntriesForMcp(args: DeleteEntriesArgs) {
  const rundownId = resolveTargetRundownId(args);
  const rundown = await deleteEntries(rundownId, args.ids);
  return { target: getTargetMeta(rundownId), deleted: args.ids, order: rundown.order };
}

export async function reorderEntryForMcp(args: ReorderEntryArgs) {
  const rundownId = resolveTargetRundownId(args);
  const rundown = await reorderEntry(rundownId, args.entryId, args.destinationId, args.order);
  return { target: getTargetMeta(rundownId), order: rundown.order };
}

export async function groupEntriesForMcp(args: GroupEntriesArgs) {
  assertKnownCustomFields(args.custom);
  const rundownId = resolveTargetRundownId(args);
  const rundown = getRundownById(rundownId);

  if (!Array.isArray(args.ids) || args.ids.length === 0) {
    throw new Error('Provide at least one entry ID to group.');
  }

  for (const id of args.ids) {
    const entry = rundown.entries[id];
    if (!entry) {
      throw new Error(`No entry with id ${id}`);
    }
    if (entry.type === SupportedEntry.Group) {
      throw new Error(`Cannot group group entry ${id}. Groups cannot be nested.`);
    }
    if ('parent' in entry && entry.parent) {
      throw new Error(`Cannot group nested entry ${id}. Move it out of its group first.`);
    }
  }

  const updatedRundown = await groupEntries(rundownId, args.ids);
  const group = Object.values(updatedRundown.entries).find(
    (entry): entry is OntimeGroup =>
      entry.type === SupportedEntry.Group && args.ids.every((id) => entry.entries.includes(id)),
  );

  if (!group) {
    throw new Error('Group operation did not create a group for the provided entries.');
  }

  const patch = toGroupPatch(args, group.id);
  const entry = patch ? await editEntry(rundownId, patch) : group;

  return { target: getTargetMeta(rundownId), entry, order: updatedRundown.order };
}

export async function ungroupEntryForMcp(args: UngroupEntryArgs) {
  const rundownId = resolveTargetRundownId(args);
  const rundown = getRundownById(rundownId);
  const entry = rundown.entries[args.id];

  if (!entry || entry.type !== SupportedEntry.Group) {
    throw new Error(`Group with ID ${args.id} not found or is not a group`);
  }

  const updatedRundown = await ungroupEntries(rundownId, args.id);
  return { target: getTargetMeta(rundownId), ungrouped: args.id, order: updatedRundown.order };
}

export async function batchCreateEntriesForMcp(args: BatchCreateEntriesArgs) {
  const { entries = [], after } = args;
  validateBatchCreateEntries(entries);
  const allEntries = flattenBatchCreateEntries(entries);
  assertKnownCustomFields(...allEntries.map((entry) => entry.custom));
  const rundownId = resolveTargetRundownId(args);
  let previousId = after;
  const created: OntimeEntry[] = [];

  for (const entryArgs of entries) {
    // eslint-disable-next-line no-await-in-loop -- top-level entries chain after the previously created one
    const entry = await createBatchEntry(rundownId, entryArgs, previousId);
    created.push(...entry.created);
    previousId = entry.entry.id;
  }

  return { target: getTargetMeta(rundownId), created };
}

function flattenBatchCreateEntries(entries: BatchCreateEntryArgs[]): BatchCreateEntryArgs[] {
  return entries.flatMap((entry) => [entry, ...flattenBatchCreateEntries(entry.children ?? [])]);
}

function validateBatchCreateEntries(entries: BatchCreateEntryArgs[], insideGroup = false) {
  for (const entry of entries) {
    if (insideGroup && entry.type === SupportedEntry.Group) {
      throw new Error('Cannot create a group inside another group.');
    }

    if (entry.children?.length && entry.type !== SupportedEntry.Group) {
      throw new Error('Only group entries can have children.');
    }

    validateBatchCreateEntries(entry.children ?? [], entry.type === SupportedEntry.Group);
  }
}

async function createBatchEntry(
  rundownId: string,
  entryArgs: BatchCreateEntryArgs,
  previousId?: EntryId,
  parentId?: EntryId,
): Promise<{ entry: OntimeEntry; created: OntimeEntry[] }> {
  if (parentId && entryArgs.type === SupportedEntry.Group) {
    throw new Error('Cannot create a group inside another group.');
  }

  const { children: _children, ...createArgs } = entryArgs;
  const payload = toEntryPayload(createArgs);
  const insertOptions = {
    ...(previousId ? { after: previousId } : {}),
    ...(parentId ? { parent: parentId } : {}),
  };

  const createdEntry = await addEntry(rundownId, { ...payload, ...insertOptions } as EventPostPayload);
  const entry = await updateCreatedGroup(rundownId, createArgs, createdEntry);
  const created = [entry];

  if (entryArgs.children?.length) {
    if (entry.type !== SupportedEntry.Group) {
      throw new Error('Only group entries can have children.');
    }

    let previousChildId: EntryId | undefined;
    for (const childArgs of entryArgs.children) {
      // eslint-disable-next-line no-await-in-loop -- each entry chains after the previously created one
      const child = await createBatchEntry(rundownId, childArgs, previousChildId, entry.id);
      created.push(...child.created);
      previousChildId = child.entry.id;
    }
  }

  return { entry, created };
}

export async function batchUpdateEntriesForMcp(args: BatchUpdateEntriesArgs) {
  assertKnownCustomFields(args.data.custom);
  const rundownId = resolveTargetRundownId(args);
  const rundown = await batchEditEntries(rundownId, args.ids, args.data);
  return { target: getTargetMeta(rundownId), updated: args.ids, order: rundown.order };
}

export async function createCustomFieldForMcp(args: CreateCustomFieldArgs) {
  const label = args.label?.trim();
  // same constraint the HTTP route enforces in customFields.validation.ts
  if (!label || !checkRegex.isAlphanumericWithSpace(label)) {
    throw new Error('Invalid label: use letters, numbers and spaces only, e.g. "Camera Angle".');
  }

  const key = customFieldLabelToKey(label);
  const existingFields = getProjectCustomFields();
  const clash = Object.keys(existingFields).find((existing) => existing.toLowerCase() === key.toLowerCase());
  if (clash) {
    throw new Error(
      `A custom field with key "${clash}" (label "${existingFields[clash].label}") already exists. ` +
        `Reuse it in entry.custom["${clash}"] instead of creating a duplicate, or pick a clearly different label.`,
    );
  }

  const updated = await createCustomField({ label, type: args.type, colour: args.colour });
  return { key, customFields: updated };
}

export async function updateCustomFieldForMcp(args: UpdateCustomFieldArgs) {
  const projectRundowns = getDataProvider().getProjectRundowns();
  const updated = await editCustomField(args.key, { label: args.label, colour: args.colour }, projectRundowns);
  return { customFields: updated };
}

export async function deleteCustomFieldForMcp(args: DeleteCustomFieldArgs) {
  const projectRundowns = getDataProvider().getProjectRundowns();
  const updated = await deleteCustomField(args.key, projectRundowns);
  return { customFields: updated };
}
