import { getProjectData } from '../api-data/project-data/projectData.dao.js';
import { getCurrentRundown, getProjectCustomFields } from '../api-data/rundown/rundown.dao.js';
import { normalisedToRundownArray } from '../api-data/rundown/rundown.utils.js';
import { getDataProvider } from '../classes/data-provider/DataProvider.js';
import type { ListResourcesResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';

// Static Ontime data model reference — agents read this once per session to understand
// the rundown structure, time format, and entry types before issuing tool calls.
const ONTIME_SCHEMA_MARKDOWN = `# Ontime data model

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

There are three entry types discriminated by \`type\`:

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
  delay: number              // accumulated delay in ms
  timerType: 'count-down' | 'count-up' | 'time-to-end' | 'clock'
  endAction: 'none' | 'stop' | 'load-next' | 'play-next'
  linkStart: boolean         // chain start to previous event's end
  countToEnd: boolean        // timer counts to planned end time
  skip: boolean              // event is skipped during playback
  timeWarning: number        // ms before end to trigger 'warning' state
  timeDanger: number         // ms before end to trigger 'danger' state
  custom: { [key: string]: string }   // custom field values
  triggers: AutomationTrigger[]
}
\`\`\`

### \`delay\` — Delay (schedule shift applied to following events)
\`\`\`
{ type: 'delay', id, duration: number }
\`\`\`

### \`group\` — Group (nested container of entries)
\`\`\`
{ type: 'group', id, title, colour, note, entries: EntryId[], targetDuration?: number }
\`\`\`

## Time format
All time fields are **milliseconds from midnight (local)**. Examples:
- 09:00:00 = 32400000
- 09:30:00 = 34200000
- 14:15:00 = 51300000
- duration of 45 min = 2700000

## Custom fields
Custom fields are project-scoped name/type/colour definitions stored at \`ontime://project/custom-fields\`. Each event stores values at \`event.custom[fieldKey]\`.

## Playback states (runtime only)
\`'stop' | 'play' | 'pause' | 'armed' | 'roll'\`. When playback is not \`stop\`, mutating tools warn that changes are visible immediately.

## Useful resource URIs
- \`ontime://schema\` — this document
- \`ontime://rundown/current\` — the currently loaded rundown (JSON)
- \`ontime://rundowns\` — all rundowns in the project (JSON)
- \`ontime://project/info\` — project metadata (JSON)
- \`ontime://project/custom-fields\` — custom field definitions (JSON)
- \`ontime://docs\` — index of Ontime documentation topics with URLs

## Further reading
Full Ontime documentation: **https://docs.getontime.no**
Read \`ontime://docs\` for a topic index with direct links.
`;

// Curated documentation index — agents read this to find official docs on specific topics.
const ONTIME_DOCS_MARKDOWN = `# Ontime Documentation Index

Main site: https://docs.getontime.no

## Getting started
- Installation & setup: https://docs.getontime.no/installation/

## Core concepts
- Rundown: https://docs.getontime.no/concepts/rundown/
- Timer types (count-down, count-up, time-to-end, clock): https://docs.getontime.no/concepts/timer/
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

export const RESOURCE_DEFINITIONS: ListResourcesResult['resources'] = [
  {
    uri: 'ontime://schema',
    name: 'ontime-schema',
    title: 'Ontime data model reference',
    description:
      'Markdown reference for rundown structure, event fields, time format, and entry types. Read once per session to ground tool calls in the correct data model.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'ontime://rundown/current',
    name: 'current-rundown',
    title: 'Currently loaded rundown',
    description:
      'The rundown currently active in Ontime, with its full entries map and order. Re-read after any mutating call to see updated state.',
    mimeType: 'application/json',
  },
  {
    uri: 'ontime://rundowns',
    name: 'project-rundowns',
    title: 'All rundowns in the project',
    description: 'List of every rundown stored in the current project file, plus the ID of the one currently loaded.',
    mimeType: 'application/json',
  },
  {
    uri: 'ontime://project/info',
    name: 'project-info',
    title: 'Project metadata',
    description: 'Project title, description, URL, info, logo, and custom header fields.',
    mimeType: 'application/json',
  },
  {
    uri: 'ontime://project/custom-fields',
    name: 'project-custom-fields',
    title: 'Custom field definitions',
    description:
      'Map of custom field keys to their label, type, and colour. Events reference these keys in their `custom` object.',
    mimeType: 'application/json',
  },
  {
    uri: 'ontime://docs',
    name: 'ontime-docs',
    title: 'Ontime documentation index',
    description:
      'Curated index of Ontime documentation topics with direct links to https://docs.getontime.no. Read this when you need to understand a concept in more depth or want to point the user to official documentation.',
    mimeType: 'text/markdown',
  },
];

export function handleReadResource(uri: string): ReadResourceResult {
  if (uri === 'ontime://schema') {
    return { contents: [{ uri, mimeType: 'text/markdown', text: ONTIME_SCHEMA_MARKDOWN }] };
  }

  if (uri === 'ontime://rundown/current') {
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(getCurrentRundown()) }],
    };
  }

  if (uri === 'ontime://rundowns') {
    const rundowns = normalisedToRundownArray(getDataProvider().getProjectRundowns());
    const loaded = getCurrentRundown().id;
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ loaded, rundowns }) }],
    };
  }

  if (uri === 'ontime://project/info') {
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(getProjectData()) }] };
  }

  if (uri === 'ontime://project/custom-fields') {
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(getProjectCustomFields()) }],
    };
  }

  if (uri === 'ontime://docs') {
    return { contents: [{ uri, mimeType: 'text/markdown', text: ONTIME_DOCS_MARKDOWN }] };
  }

  throw new Error(`Unknown resource URI: ${uri}`);
}
