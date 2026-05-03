import type { IncomingMessage, ServerResponse } from 'node:http';

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
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  type CallToolResult,
  type ListToolsResult,
  type GetPromptResult,
  type ListPromptsResult,
} from '@modelcontextprotocol/sdk/types.js';

const CHARACTER_LIMIT = 25_000;

// ---- Shared event field JSON schemas ----
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
  linkStart: { type: 'boolean', description: "Chain this event's start time to the previous event's end time (useful for propagating schedule changes)" },
  countToEnd: { type: 'boolean', description: 'Timer counts toward the scheduled end time rather than elapsed time' },
  timeWarning: { type: 'number', description: 'ms before timeEnd to enter warning state (e.g. 300000 = 5 min)' },
  timeDanger: { type: 'number', description: 'ms before timeEnd to enter danger state (e.g. 60000 = 1 min)' },
} as const;

const EVENT_WRITABLE_FIELDS = {
  cue: { type: 'string', description: 'Short free-form label (keep under 7 chars); prefix conventions: K=keynote, P=panel, B=break, M=meal' },
  title: { type: 'string', description: 'Event title shown in the rundown and views' },
  note: { type: 'string', description: 'Free-text note for production notes or references' },
  colour: { type: 'string', description: 'Hex colour (#RRGGBB) for visual grouping, e.g. "#4A90D9"' },
  skip: { type: 'boolean', description: 'If true, event is skipped during playback' },
  ...EVENT_TIMER_FIELDS,
} as const;

// ---- Tool definitions ----
const TOOL_DEFINITIONS = [
  // --- Rundown read ---
  {
    name: 'ontime_get_rundown',
    description:
      'Get the currently loaded rundown. Returns { order: EntryId[], entries: { [id]: OntimeEntry } }. If the rundown exceeds 25 000 chars, returns only the order array with a warning — fetch individual events with ontime_get_event.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'ontime_get_rundown_metadata',
    description:
      'Get cached metadata for the current rundown. Returns: totalDelay, totalDuration, totalDays, firstStart, lastEnd, flags (flagged entry IDs), playableEventOrder, timedEventOrder, flatEntryOrder.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'ontime_get_event',
    description: 'Get a single event by id or cue. Provide either id or cue (not both). Returns the full entry object.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Event ID (from rundown.entries key or event.id)' },
        cue: { type: 'string', description: 'Human-facing cue label, e.g. "K01"' },
      },
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  // --- Rundown mutations ---
  {
    name: 'ontime_create_event',
    description: 'Create a new event in the rundown. Omit after/before to append at the end.',
    inputSchema: {
      type: 'object',
      required: ['cue', 'title', 'timeStart', 'timeEnd', 'duration'],
      properties: {
        cue: { type: 'string', description: 'Short free-form label (keep under 7 chars); prefix conventions: K=keynote, P=panel, B=break, M=meal' },
        title: { type: 'string', description: 'Event title shown in the rundown and views' },
        timeStart: { type: 'number', description: 'Start time in ms from midnight (e.g. 09:00 = 32400000)' },
        timeEnd: { type: 'number', description: 'End time in ms from midnight' },
        duration: { type: 'number', description: 'Duration in ms (should equal timeEnd - timeStart)' },
        after: { type: 'string', description: 'Insert after this event ID' },
        before: { type: 'string', description: 'Insert before this event ID' },
        note: { type: 'string', description: 'Free-text note for production notes or references' },
        colour: { type: 'string', description: 'Hex colour (#RRGGBB) for visual grouping, e.g. "#4A90D9"' },
        skip: { type: 'boolean', description: 'If true, event is skipped during playback' },
        ...EVENT_TIMER_FIELDS,
      },
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
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
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'ontime_delete_event',
    description: 'Delete one or more events from the rundown',
    inputSchema: {
      type: 'object',
      required: ['ids'],
      properties: {
        ids: { type: 'array', items: { type: 'string' }, description: 'Array of event IDs to delete' },
      },
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
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
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
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
              cue: { type: 'string', description: 'Short free-form label (keep under 7 chars); prefix conventions: K=keynote, P=panel, B=break, M=meal' },
              title: { type: 'string', description: 'Event title shown in the rundown and views' },
              timeStart: { type: 'number', description: 'Start time in ms from midnight' },
              timeEnd: { type: 'number', description: 'End time in ms from midnight' },
              duration: { type: 'number', description: 'Duration in ms (should equal timeEnd - timeStart)' },
              note: { type: 'string', description: 'Free-text note for production notes or references' },
              colour: { type: 'string', description: 'Hex colour (#RRGGBB) for visual grouping, e.g. "#4A90D9"' },
              skip: { type: 'boolean', description: 'If true, event is skipped during playback' },
              ...EVENT_TIMER_FIELDS,
            },
          },
        },
      },
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
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
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  },
  // --- Rundown management ---
  {
    name: 'ontime_list_rundowns',
    description:
      'List all rundowns in the current project. Returns rundown IDs and titles, plus the ID of the currently loaded one.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
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
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
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
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
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
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'ontime_delete_rundown',
    description: 'Delete a rundown (cannot delete the currently loaded rundown or the last remaining rundown)',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string', description: 'Rundown ID to delete' } },
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'ontime_duplicate_rundown',
    description: 'Duplicate a rundown, creating a copy with a new ID. Does not switch to the copy.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string', description: 'Rundown ID to duplicate' } },
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  // --- Timer & project ---
  {
    name: 'ontime_get_timer_state',
    description:
      'Get the current timer/playback state. Returns: clock (time of day), timer ({ playback, current, elapsed, phase, expectedFinish, addedTime, startedAt }), eventNow (full event object or null), eventNext (full event object or null), offset.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'ontime_get_project_info',
    description: 'Get current project metadata: title, description, url, info, logo, and custom header fields (array of { title, value, url }).',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
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
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  },
  // --- Automations & custom fields ---
  {
    name: 'ontime_list_automations',
    description:
      'List all automations and triggers. Returns { enabledAutomations, triggers: Trigger[], automations: { [id]: Automation } }.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'ontime_create_automation',
    description:
      'Create a new automation (trigger + filter + outputs). Ontime provides a test button in the Automations panel — encourage the user to preview the output before relying on it in a live show.',
    inputSchema: {
      type: 'object',
      required: ['title', 'filterRule', 'filters', 'outputs'],
      properties: {
        title: { type: 'string', description: 'Human-readable label for the automation' },
        filterRule: {
          type: 'string',
          enum: ['all', 'any'],
          description: 'Whether all filters must match (all) or any single filter is enough (any)',
        },
        filters: {
          type: 'array',
          items: { type: 'object' },
          description:
            'Conditions evaluated against event fields. Each filter: { field, operator, value } where operator is one of equals/not_equals/greater_than/less_than/contains/not_contains',
        },
        outputs: {
          type: 'array',
          items: { type: 'object' },
          description:
            'Actions to fire when filters match. Supported types: osc ({ type, targetIP, targetPort, address, args }), http ({ type, url }), ontime ({ type, action })',
        },
      },
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  {
    name: 'ontime_get_custom_fields',
    description:
      'Get the project custom field definitions. Returns { [key]: { label, type: "text"|"image", colour } }. Keys are referenced in event.custom[key].',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  // --- Project file management ---
  {
    name: 'ontime_list_projects',
    description: 'List all project files on disk. Returns filenames, timestamps, and the last-loaded project name.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
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
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
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
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
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
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
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
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  {
    name: 'ontime_delete_project',
    description: 'Delete a project file from disk. Fails if the file is currently loaded.',
    inputSchema: {
      type: 'object',
      required: ['filename'],
      properties: { filename: { type: 'string', description: 'Project filename to delete (with .json extension)' } },
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
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
  const err = (e: unknown): CallToolResult => ({
    content: [{ type: 'text', text: text({ error: String(e) }) }],
    isError: true,
  });
  const okMutation = (data: unknown): CallToolResult => {
    const playback = getState().timer.playback;
    const payload =
      playback !== 'stop'
        ? { warning: 'Playback is running — this change takes effect immediately.', result: data }
        : data;
    return { content: [{ type: 'text', text: text(payload) }] };
  };

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

    case 'ontime_get_rundown_metadata': {
      return ok(getRundownMetadata());
    }

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

    case 'ontime_delete_event': {
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

    case 'ontime_list_rundowns': {
      return ok(rundownListResponse());
    }

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

    case 'ontime_delete_rundown': {
      try {
        const id = args.id as string;
        const dataProvider = getDataProvider();
        if (id === getCurrentRundown().id) return err('Cannot delete the currently loaded rundown');
        const rundowns = dataProvider.getProjectRundowns();
        if (Object.keys(rundowns).length <= 1) return err('Cannot delete the last rundown');
        await dataProvider.deleteRundown(id);
        return okMutation(rundownListResponse());
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

    case 'ontime_get_project_info': {
      return ok(getProjectData());
    }

    case 'ontime_update_project_info': {
      try {
        const updated = await editCurrentProjectData(args as never);
        return ok(updated);
      } catch (e) {
        return err(e);
      }
    }

    case 'ontime_list_automations': {
      const settings = getAutomationSettings();
      return ok({
        enabledAutomations: settings.enabledAutomations,
        triggers: settings.triggers,
        automations: settings.automations,
      });
    }

    case 'ontime_create_automation': {
      try {
        const result = await addAutomation(args as never);
        return okMutation(result);
      } catch (e) {
        return err(e);
      }
    }

    case 'ontime_get_custom_fields': {
      return ok(getProjectCustomFields());
    }

    case 'ontime_list_projects': {
      return ok(await getProjectList());
    }

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

// ---- Build and configure a new MCP Server instance ----
function createMcpServer(): Server {
  const server = new Server(
    { name: 'ontime-mcp-server', version: '1.0.0' },
    { capabilities: { tools: {}, prompts: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async (): Promise<ListToolsResult> => {
    return { tools: TOOL_DEFINITIONS as unknown as ListToolsResult['tools'] };
  });

  server.setRequestHandler(ListPromptsRequestSchema, async (): Promise<ListPromptsResult> => {
    return {
      prompts: [
        {
          name: 'create_rundown_from_agenda',
          description: 'Convert a plain-text agenda into an Ontime rundown using ontime_create_events_batch',
          arguments: [{ name: 'agenda', description: 'Plain-text agenda to convert', required: true }],
        },
        {
          name: 'bulk_edit_rundown',
          description: 'Apply a bulk change across the rundown (recolour, reschedule, skip events, etc.)',
          arguments: [{ name: 'instruction', description: 'What to change, e.g. "colour all keynotes blue"', required: true }],
        },
        {
          name: 'validate_rundown',
          description: 'Check the current rundown for common issues: missing cues, overlaps, gaps, zero-duration events',
          arguments: [],
        },
        {
          name: 'restructure_rundown',
          description: 'Reorder events in the rundown according to an instruction',
          arguments: [{ name: 'instruction', description: 'How to restructure, e.g. "move all breaks to after keynotes"', required: true }],
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const { name, arguments: args = {} } = request.params;
    return handleToolCall(name, args as Record<string, unknown>);
  });

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
1. Call ontime_get_rundown to see current state and identify an \`after\` anchor if appending.
2. Build an array of events in order and call ontime_create_events_batch ONCE with all of them. This is much faster than calling ontime_create_event per item.
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
1. Call ontime_get_rundown to see the current events, their IDs, and field values.
2. Determine which event IDs are affected by the instruction.
3. If every affected event receives the SAME field changes (e.g. "colour all keynotes purple", "skip all breaks"): call ontime_batch_update_events once with { ids, data }.
4. If each event needs DIFFERENT values (e.g. "shift everything 30 minutes" — each event gets a different timeStart/timeEnd): compute the new values per event, then call ontime_update_event for each, or call ontime_batch_update_events multiple times grouped by shared data.
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
1. Call ontime_get_rundown to read all events.
2. Call ontime_get_rundown_metadata for totals (total duration, first/last times, flagged IDs).
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
1. Call ontime_get_rundown to see the current order and event fields.
2. Compute the target order as an array of event IDs.
3. For each event that needs to move, call ontime_reorder_event with { entryId, destinationId, order: 'before' | 'after' }.
4. Call ontime_get_rundown again at the end to confirm the new order.

Tip: moving items in the "to" direction of the target position minimises reorder calls. Plan the sequence of moves to avoid moving the same event twice.`,
            },
          },
        ],
      };
    }

    throw new Error(`Unknown prompt: ${name}`);
  });

  return server;
}

// ---- Express router (stateless) ----
export const mcpRouter = express.Router();

mcpRouter.post('/', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.on('close', () => transport.close());
  const server = createMcpServer();
  await server.connect(transport);
  await transport.handleRequest(req as IncomingMessage, res as unknown as ServerResponse, req.body);
});

mcpRouter.get('/', (_req, res) => {
  res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
});

mcpRouter.delete('/', (_req, res) => {
  res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
});
