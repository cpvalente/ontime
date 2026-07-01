/**
 * Agent-facing Ontime MCP documentation.
 *
 * Tool field schemas (EVENT_TIMER_FIELDS, EVENT_WRITABLE_FIELDS) and the schema resource
 * (ONTIME_SCHEMA_MARKDOWN) are maintained here so tool descriptions, prompt guidance,
 * and the agent-readable reference document use the same wording.
 *
 * Canonical type definitions live in packages/types/src/definitions/core/OntimeEntry.ts.
 * Keep this file concise and update it when MCP-exposed fields change.
 */

// ---- Shared event field JSON schemas ----
// Imported by mcp.tools.ts and spread into tool inputSchema.properties.

export const EVENT_TIMER_FIELDS = {
  timerType: {
    type: 'string',
    enum: ['count-down', 'count-up', 'clock', 'none'],
    description: 'count-down: countdown from duration; count-up: elapsed time; clock: wall clock; none: no timer shown',
  },
  endAction: {
    type: 'string',
    enum: ['none', 'load-next', 'play-next'],
    description:
      'Action when the event ends. Defaults to none. load-next and play-next create playback automations (load-next arms the next event, play-next auto-starts it) that remove operator control between events and can surprise operators. Only set load-next or play-next when the user explicitly asks for automatic cueing or chaining; otherwise omit this field and leave it as none. Do not add end actions just because events are back-to-back.',
  },
  linkStart: {
    type: 'boolean',
    description:
      "Link this event's start time to the previous playable event's end time. Linked events allow time changes to propagate through the rundown. Unlinking would prevent propagation and lock this event's start time to the schedule",
  },
  countToEnd: {
    type: 'boolean',
    description:
      'Advanced timing mode: countdown targets the scheduled timeEnd instead of the event duration. This can surprise operators when an event starts late or the schedule shifts; only set true after explaining the behaviour and confirming the user wants it. This can be useful for a deadline, where an event always needs to end at the schedule time, ie: a curfew or a broadcast window.',
  },
  timeStrategy: {
    type: 'string',
    enum: ['lock-duration', 'lock-end'],
    description:
      'How linked events adapt to an inherited start: lock-duration recalculates end, lock-end recalculates duration',
  },
  timeWarning: { type: 'number', description: 'ms before timeEnd to enter warning state (e.g. 300000 = 5 min)' },
  timeDanger: { type: 'number', description: 'ms before timeEnd to enter danger state (e.g. 60000 = 1 min)' },
} as const;

export const EVENT_WRITABLE_FIELDS = {
  cue: { type: 'string', description: 'Short free-form cue label — ask the user what naming convention they prefer' },
  title: { type: 'string', description: 'Event title shown in the rundown and views' },
  note: { type: 'string', description: 'Free-text note for production notes or references' },
  colour: {
    type: 'string',
    description: 'Hex colour (#RRGGBB) for visual grouping — ask the user what colour convention they use',
  },
  skip: { type: 'boolean', description: 'If true, event is skipped during playback' },
  flag: {
    type: 'boolean',
    description: 'Mark the event as a critical operational marker — use sparingly for maximum impact',
  },
  custom: {
    type: 'object',
    additionalProperties: { type: 'string' },
    description:
      'Custom field values keyed by existing project field key, e.g. { "camera": "CAM 2" }. Get available keys with ontime_get_custom_fields. Adding new custom field definitions is a separate project-level operation.',
  },
  ...EVENT_TIMER_FIELDS,
} as const;

export const RUNDOWN_TARGET_FIELD = {
  rundownId: {
    type: 'string',
    description:
      'Optional target rundown ID. Omit to target the currently loaded live rundown; provide an ID from ontime_list_rundowns to edit a background rundown without loading it.',
  },
} as const;

// ---- Agent-readable schema document ----
// Served at ontime://schema. Agents read this once per session to orient themselves
// before issuing tool calls.

export const ONTIME_SCHEMA_MARKDOWN = `# Ontime data model

A concise reference for how Ontime structures rundowns, events, and related data.

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

There are four entry types discriminated by \`type\`:

### \`event\` — OntimeEvent (a timed show item)
\`\`\`
{
  type: 'event'
  id: EntryId
  cue: string                // human-facing cue label
  title: string
  note: string
  colour: string             // hex, e.g. "#4A90D9"
  timeStart: number          // ms from midnight (09:00 = 32400000)
  timeEnd: number            // ms from midnight
  duration: number           // ms (= timeEnd - timeStart)
  delay: number              // delay accumulated from rundown delay entries
  dayOffset: number          // runtime calculated day offset from the rundown start schedule, increments when the rundown crosses midnight
  gap: number                // schedule gap between sequential playable events; negative gap means overlap
  timerType: 'count-down' | 'count-up' | 'clock' | 'none'
  endAction: 'none' | 'load-next' | 'play-next'   // load-next/play-next create playback automations; leave as none unless the user explicitly asks for cueing/chaining
  linkStart: boolean         // chain start to previous event's end
  countToEnd: boolean        // advanced mode: counts to scheduled timeEnd instead of duration; confirm before enabling
  skip: boolean              // event is skipped during playback
  flag: boolean              // critical operational marker, highlighted to operators
  timeStrategy: 'lock-duration' | 'lock-end'
  timeWarning: number        // ms before end to trigger 'warning' state
  timeDanger: number         // ms before end to trigger 'danger' state
  custom: { [key: string]: string }   // custom field values
  triggers: Trigger[]        // automation trigger references
  parent: EntryId | null     // parent group, when nested
  revision: number           // entry revision
}
\`\`\`

### \`delay\` — OntimeDelay (schedule shift applied to following events)
\`\`\`
{ type: 'delay', id, duration: number, parent: EntryId | null }
\`\`\`

### \`group\` — OntimeGroup (nested container of entries)
\`\`\`
{
  type: 'group'
  id: EntryId
  title: string
  colour: string
  note: string
  entries: EntryId[]
  targetDuration: number | null
  custom: { [key: string]: string }
  timeStart: number | null     // calculated from nested entries (runtime)
  timeEnd: number | null       // calculated from nested entries (runtime)
  duration: number             // calculated from nested entries (runtime)
  isFirstLinked: boolean       // whether the first nested event is linked (runtime)
  revision: number
}
\`\`\`
MCP entry creation accepts title plus optional colour, note, custom values and targetDuration for groups. In batch creation, a group may also include \`children\` to create child events, milestones or delays inside the group. Groups cannot be nested.

For existing entries, use \`ontime_group_entries\` to create a group from top-level non-group entries, and \`ontime_ungroup_entry\` to dissolve a group back into top-level entries. Use \`ontime_reorder_entry\` only for targeted moves into, out of, or around an existing group.

### \`milestone\` — OntimeMilestone (marker with no timer)
\`\`\`
{ type: 'milestone', id, cue, title, note, colour, custom, parent: EntryId | null }
\`\`\`

## Time format
Ontime stores time values as **milliseconds from midnight (local)**. Convert user-facing times before calling tools: \`10:30\` means \`37800000\`, and a duration like \`45 min\` means \`2700000\`.

\`timeEnd\` may be lower than \`timeStart\` when an event crosses midnight; duration is calculated across the day boundary.

Examples:
- 09:00:00 = 32400000
- 09:30:00 = 34200000
- 14:15:00 = 51300000
- Duration of 45 min = 2700000

## Custom fields
Custom fields are project-scoped definitions. Get definitions at \`ontime://project/custom-fields\` or with \`ontime_get_custom_fields\`.
Events, milestones and groups store values at \`entry.custom[fieldKey]\`.

Managing field definitions:
- Read: \`ontime_get_custom_fields\` — returns \`{ [key]: { label, type, colour } }\`
- Create: \`ontime_create_custom_field { label, type, colour }\` — key is auto-derived from label (spaces → underscores). Confirm the derived key before creating. Returns \`{ key, customFields }\`.
- Rename/recolour: \`ontime_update_custom_field { key, label?, colour? }\` — renaming the label changes the derived key and cascades to all entry references across all rundowns. Type cannot be changed.
- Delete: \`ontime_delete_custom_field { key }\` — removes the field definition and its values from every entry in all rundowns. Destructive, confirm first.

When setting \`custom\` values on entries, only use existing field keys. If a key does not exist, create it with \`ontime_create_custom_field\` first.
Show the existing field list before creating to avoid duplicates such as \`Cam\`, \`camera\`, and \`Cameras\`.

## Targeting rundowns
Entry read/write tools accept an optional \`rundownId\`.
- Omit \`rundownId\` to target the currently loaded live rundown.
- Pass a rundown ID from \`ontime_list_rundowns\` to edit a background rundown without loading it.
- Loading a rundown with \`ontime_load_rundown\` switches the live rundown and resets runtime state; do not load a rundown just to edit it in the background.

## Playback states (runtime only)
\`'stop' | 'play' | 'pause' | 'armed' | 'roll'\`
When playback is not \`stop\`, mutations to the loaded rundown affect the live rundown immediately, so confirm with the user before editing. Mutations to a background rundown using \`rundownId\` do not interrupt playback.

## Available resources
- \`ontime://schema\` — this document
- \`ontime://rundown/current\` — the currently loaded rundown (JSON)
- \`ontime://rundowns\` — all rundowns in the project (JSON)
- \`ontime://project/info\` — project metadata (JSON)
- \`ontime://project/custom-fields\` — custom field definitions (JSON)
- \`ontime://docs\` — index of Ontime documentation topics with URLs

## Further reading
Full Ontime documentation: **https://docs.getontime.no**
`;

// ---- Documentation index ----
// Served at ontime://docs. Agents read this when they need to point users to official docs.

export const ONTIME_DOCS_MARKDOWN = `# Ontime Documentation Index

Main site: https://docs.getontime.no

## Getting started
- Installation & setup: https://docs.getontime.no/installation/

## Core concepts
- Rundown: https://docs.getontime.no/concepts/rundown/
- Timer types (count-down, count-up, clock, none): https://docs.getontime.no/concepts/timer/
- Time entry format: https://docs.getontime.no/concepts/time-entry/
- Event actions (end action, link start): https://docs.getontime.no/concepts/event-actions/
- Delays and blocks: https://docs.getontime.no/concepts/delays-and-blocks/

## Features
- Custom fields: https://docs.getontime.no/features/custom-fields/
- Automations (triggers, filters, outputs): https://docs.getontime.no/features/automations/
- URL presets / shared views: https://docs.getontime.no/features/url-presets/
- HTTP Integration: https://docs.getontime.no/api/http/
- OSC Integration: https://docs.getontime.no/api/osc/

## API reference
- REST API overview: https://docs.getontime.no/api/
- WebSocket events: https://docs.getontime.no/api/websocket/
`;
