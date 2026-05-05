import type { GetPromptResult, ListPromptsResult } from '@modelcontextprotocol/sdk/types.js';

export const PROMPT_DEFINITIONS: ListPromptsResult['prompts'] = [
  {
    name: 'create_rundown_from_agenda',
    description: 'Convert a plain-text agenda into an Ontime rundown using ontime_create_events_batch',
    arguments: [{ name: 'agenda', description: 'Plain-text agenda to convert', required: true }],
  },
  {
    name: 'bulk_edit_rundown',
    description: 'Apply a bulk change across the rundown (recolour, reschedule, skip events, etc.)',
    arguments: [
      {
        name: 'instruction',
        description: 'What to change, e.g. "colour all keynotes blue"',
        required: true,
      },
    ],
  },
  {
    name: 'validate_rundown',
    description: 'Check the current rundown for common issues: missing cues, overlaps, gaps, zero-duration events',
    arguments: [],
  },
  {
    name: 'restructure_rundown',
    description: 'Reorder events in the rundown according to an instruction',
    arguments: [
      {
        name: 'instruction',
        description: 'How to restructure, e.g. "move all breaks to after keynotes"',
        required: true,
      },
    ],
  },
];

export function handleGetPrompt(name: string, args: Record<string, string>): GetPromptResult {
  if (name === 'create_rundown_from_agenda') {
    const agenda = args.agenda ?? '';
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
- endAction: "load-next" for back-to-back sessions, "none" otherwise
- Ask the user what cue naming and colour conventions they prefer

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
    const instruction = args.instruction ?? '';
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
4. If each event needs DIFFERENT values (e.g. "shift everything 30 minutes"): check first if events use linkStart. If they do, changing the first linked event's timeStart cascades to all linked followers — you may only need to update one event. Otherwise, compute the new values per event and call ontime_update_event for each.
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
    const instruction = args.instruction ?? '';
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
}
