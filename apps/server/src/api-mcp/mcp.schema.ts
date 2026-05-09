/**
 * Single source of truth for Ontime MCP documentation.
 *
 * Tool field schemas (EVENT_TIMER_FIELDS, EVENT_WRITABLE_FIELDS) and the schema resource
 * (ONTIME_SCHEMA_MARKDOWN) are maintained here so that a single edit keeps tool descriptions,
 * prompt guidance, and the agent-readable reference document in sync.
 *
 * Canonical type definitions live in packages/types/src/definitions/core/OntimeEntry.ts.
 * Update this file when the data model changes.
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

export const EVENT_WRITABLE_FIELDS = {
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
  delay: number              // accumulated delay in ms (runtime)
  timerType: 'count-down' | 'count-up' | 'clock' | 'none'
  endAction: 'none' | 'load-next' | 'play-next'
  linkStart: boolean         // chain start to previous event's end
  countToEnd: boolean        // timer counts to planned end time
  skip: boolean              // event is skipped during playback
  timeWarning: number        // ms before end to trigger 'warning' state
  timeDanger: number         // ms before end to trigger 'danger' state
  custom: { [key: string]: string }   // custom field values
}
\`\`\`

### \`delay\` — OntimeDelay (schedule shift applied to following events)
\`\`\`
{ type: 'delay', id, duration: number }
\`\`\`

### \`group\` — OntimeGroup (nested container of entries)
\`\`\`
{ type: 'group', id, title, colour, note, entries: EntryId[], targetDuration?: number }
\`\`\`

### \`milestone\` — OntimeMilestone (marker with no timer)
\`\`\`
{ type: 'milestone', id, cue, title, note, colour }
\`\`\`

## Time format
All time fields are **milliseconds from midnight (local)**. Examples:
- 09:00:00 = 32400000
- 09:30:00 = 34200000
- 14:15:00 = 51300000
- Duration of 45 min = 2700000

## Custom fields
Custom fields are project-scoped definitions. Get definitions at \`ontime://project/custom-fields\`.
Each event stores values at \`event.custom[fieldKey]\`.

## Playback states (runtime only)
\`'stop' | 'play' | 'pause' | 'armed' | 'roll'\`
When playback is not \`stop\`, mutating tools warn that changes are visible immediately.

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
