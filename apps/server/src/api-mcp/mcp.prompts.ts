import type { GetPromptResult, ListPromptsResult } from '@modelcontextprotocol/sdk/types.js';

export const PROMPT_DEFINITIONS: ListPromptsResult['prompts'] = [
  {
    name: 'create_rundown_from_agenda',
    description: 'Convert a plain-text agenda into an Ontime rundown using ontime_batch_create_entries',
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

function userPrompt(description: string, text: string): GetPromptResult {
  return { description, messages: [{ role: 'user', content: { type: 'text', text } }] };
}

export function handleGetPrompt(name: string, args: Record<string, string>): GetPromptResult {
  if (name === 'create_rundown_from_agenda') {
    return userPrompt(
      'Build an Ontime rundown from a plain-text agenda',
      `Convert the following agenda into an Ontime rundown.
Read the ontime://schema resource if you need a data model reference.

Steps:
1. Call ontime_get_rundown to see current state and identify an \`after\` anchor if appending.
2. Build an array of events in order and call ontime_batch_create_entries ONCE with all of them. This is much faster than calling ontime_create_entry per item.
3. If the rundown already has events, pass \`after: <last event id>\` on the batch call so new events chain from the end.

Entry type guidance:
- Use \`event\` for anything with a scheduled time and duration (talks, panels, breaks, meals).
- Use \`milestone\` for non-timed markers that don't advance playback (e.g. "Doors open", "Broadcast start").
- Use \`delay\` only when the user explicitly wants to model schedule drift that shifts all following events.
- Use \`group\` to collect related events into a named block. Groups are created with a title only — use ontime_update_entry afterwards to set \`targetDuration\` to the block's planned length.

Timer type (timerType):
- \`count-down\` (default): counts down from duration. Use for most timed sessions.
- \`count-up\`: counts elapsed time. Use for open-ended items like Q&A or audience discussion.
- \`clock\`: shows wall-clock time. Use for broadcast-start or house-open markers.
- \`none\`: no timer shown. Use for purely informational or non-timed items.

End action (endAction):
- \`none\` (default): stops at end; operator must manually start the next event.
- \`load-next\`: pre-arms the next event; operator triggers start. Use when a human handoff is needed.
- \`play-next\`: automatically starts the next event. Use for seamless back-to-back segments with no gap.

Linking (linkStart):
- Set \`linkStart: true\` on events that must always follow directly after the previous event's end.
- Changing the first linked event's timeStart or duration cascades to all linked followers.
- Ideal for segments within a block where only the block's start time is managed directly.

Flags (flag):
- Set \`flag: true\` on events that are critical operational markers (keynote starts, broadcast moments, VIP arrivals).
- The operator view shows a countdown to the next flagged event — use sparingly for maximum impact.

Colours:
- Ask the user what colour convention they use before applying any colours.
- Common pattern: one colour per event type (keynotes, panels, breaks, meals).
- Colours are hex strings: \`#RRGGBB\`.

Custom fields (custom):
- Call ontime_get_custom_fields for the project's field keys (cuesheet-style columns such as camera, graphics, speaker).
- Store values per entry at \`custom: { <fieldKey>: <value> }\` — only use keys that exist in the project.

Agenda:
${args.agenda}`,
    );
  }

  if (name === 'bulk_edit_rundown') {
    return userPrompt(
      'Apply a bulk change across the rundown',
      `Apply the following bulk edit to the current Ontime rundown: "${args.instruction}"

Strategy:
1. Call ontime_get_rundown to see the current events, their IDs, and field values.
2. Determine which event IDs are affected by the instruction.
3. If every affected event receives the SAME field changes (e.g. "colour all keynotes purple", "skip all breaks"): call ontime_batch_update_entries once with { ids, data }.
4. If each event needs DIFFERENT values (e.g. "shift everything 30 minutes"): check first if events use linkStart. If they do, changing the first linked event's timeStart cascades to all linked followers — you may only need to update one event. Otherwise, compute the new values per event and call ontime_update_entry for each.

Time shift mechanics:
- All time fields are milliseconds from midnight; compute arithmetic before calling the tools.
- timeEnd - timeStart = duration. When shifting times, decide whether to keep duration fixed (timeEnd moves with timeStart) or keep timeEnd fixed (duration shrinks). Provide only the fields you intend to change — the server infers the strategy from which fields are present.
- For "shift everything N minutes later": update timeStart and timeEnd per event (or just timeStart on the first event of a linkStart chain).

Automation risks:
- Setting \`endAction: 'play-next'\` on multiple events creates an automatic playback chain that removes operator control between those events. Confirm with the user before applying.
- Bulk-setting \`skip: true\` will hide events from playback. Confirm before applying to many events.`,
    );
  }

  if (name === 'validate_rundown') {
    return userPrompt(
      'Check the current rundown for common issues',
      `Validate the currently loaded Ontime rundown and report issues.

Steps:
1. Call ontime_get_rundown to read all events and their fields.
2. Call ontime_get_rundown_metadata for totals (totalDuration, totalDelay, totalDays, firstStart, lastEnd, flags).

Check and report:

Schedule integrity:
- Events with missing or duplicate \`cue\`
- Events with missing \`title\`
- Events with \`duration\` of 0 or negative
- Events where \`timeEnd\` < \`timeStart\`
- Events whose \`timeStart\` overlaps the previous event's \`timeEnd\` (gap < 0 means a conflict)
- Large unexplained gaps between consecutive events (> 30 min) that may indicate a missing break

Timing and linking:
- \`metadata.totalDays > 0\`: show spans midnight — confirm this is intentional
- \`metadata.totalDelay !== 0\`: active delay entries are shifting the schedule by this many ms; report the net shift
- Events with \`linkStart: true\` that are first in the rundown (no predecessor to link to)

Automation:
- Events with \`endAction: 'play-next'\`: these form automatic playback chains. List each chain so the user can confirm the automation is intentional.
- Events with \`flag: true\`: these are the operator's critical markers. List them so the user can verify they are correct and complete.

Skipped events:
- Events with \`skip: true\` — confirm with the user these are intentional

Totals:
- Total rundown duration and whether it matches the user's expected show length (ask if unknown)

Present issues grouped by severity: ERROR (breaks playback), WARNING (likely mistake), INFO (worth confirming).`,
    );
  }

  if (name === 'restructure_rundown') {
    return userPrompt(
      'Reorder events in the rundown',
      `Restructure the current Ontime rundown: "${args.instruction}"

Steps:
1. Call ontime_get_rundown to see the current order, groups, and event fields.
2. Note which events are inside groups (check each group's \`entries\` array vs the top-level \`order\` array).
3. Compute the target arrangement as a sequence of moves.
4. For each event that needs to move, call ontime_reorder_entry:
   - \`order: 'before'\` or \`'after'\` — places the event as a sibling next to destinationId
   - \`order: 'insert'\` — places the event inside a group (destinationId must be the group's ID)
5. Call ontime_get_rundown again to confirm the new order.

Group awareness:
- Events inside a group appear in the group's \`entries\` array, not in the top-level \`order\`.
- To move an event out of a group, reorder it before/after a top-level entry.
- To move an event into a group, use \`order: 'insert'\` with the group as destinationId.
- A group's \`targetDuration\` is a planning hint only — moving events in or out does not break anything.

Efficiency tip: plan moves in the direction of the target position to minimise reorder calls. Avoid moving the same event twice — compute the full target sequence before issuing any calls.`,
    );
  }

  throw new Error(`Unknown prompt: ${name}`);
}
