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
  {
    name: 'manage_custom_fields',
    description: 'List, create, rename, recolour, or delete project-level custom field definitions',
    arguments: [
      {
        name: 'instruction',
        description: 'What to do, e.g. "add a Speaker field" or "delete the Camera field"',
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
1. Call ontime_list_rundowns and identify the target rundown. If the user wants a background rundown, pass its \`rundownId\` in all entry read/write calls instead of loading it.
2. Call ontime_get_rundown with the chosen \`rundownId\` to see current state and identify an \`after\` anchor if appending.
3. Call ontime_get_timer_state. If playback is not \`stop\` and the target is the loaded rundown, explain that MCP edits affect the live rundown and ask the user to confirm before changing it. If the target is a background rundown, it can be edited without interrupting playback.
4. Build an array of entries in order and call ontime_batch_create_entries ONCE with all of them. This is much faster than calling ontime_create_entry per item.
5. If the rundown already has events, pass \`after: <last event id>\` on the batch call so new events chain from the end.

Entry type guidance:
- Use \`event\` for anything with a scheduled time and duration (talks, panels, breaks, meals).
- Use \`milestone\` for non-timed markers that don't advance playback (e.g. "Doors open", "Broadcast start").
- Use \`delay\` only when the user explicitly wants to model schedule drift that shifts all following events.
- Use \`group\` to collect related events into a named block. In ontime_batch_create_entries, put grouped items in the group's \`children\` array. A group may include \`title\`, \`colour\`, \`note\`, \`custom\`, and \`targetDuration\`; groups cannot be nested.

Event timing:
- Provide a title plus enough timing data for Ontime to infer a timing strategy.
- \`timeStart\` + \`duration\`: keeps duration fixed and calculates \`timeEnd\`.
- \`timeStart\` + \`timeEnd\`: keeps end time fixed and calculates \`duration\`.
- \`timeEnd\` + \`duration\`: calculates \`timeStart\`.
- Avoid sending \`timeStart\`, \`timeEnd\`, and \`duration\` together unless you intentionally want Ontime to prioritise duration and recalculate \`timeEnd\`.

Timer type (timerType):
- \`count-down\` (default): counts down from duration. Use for most timed sessions.
- \`count-up\`: counts elapsed time. Use for open-ended items like Q&A or audience discussion.
- \`clock\`: shows wall-clock time. Use for broadcast-start or house-open markers.
- \`none\`: no timer shown. Use for purely informational or non-timed items.

Count to end (countToEnd):
- This is an advanced countdown behaviour, not a timer type.
- When \`countToEnd: true\`, the timer counts to the scheduled \`timeEnd\` instead of counting down the event duration.
- This can surprise operators if an event starts late or the schedule shifts, because the displayed time may be shorter or longer than the nominal duration.
- Do not set \`countToEnd: true\` unless the user explicitly asks for "count to end", "count to scheduled end", or confirms after you explain this behaviour.

End action (endAction):
- \`none\` (default): stops at end; operator must manually start the next event.
- \`load-next\`: pre-arms the next event; operator triggers start. Use when a human handoff is needed.
- \`play-next\`: automatically starts the next event. Use for seamless back-to-back segments with no gap.

Linking (linkStart):
- \`linkStart\` controls schedule-change propagation through the rundown.
- When an event is linked, it inherits the end time of the previous playable event as its start time.
- The event's \`timeStrategy\` decides how it adapts to the inherited start: lock duration updates the end time; lock end updates the duration.
- Ideal for segments within a block where only the anchor start time and individual durations are managed directly.

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
- If the user's requested field is ambiguous, show the existing field list before choosing a key, so you avoid duplicate concepts such as \`Cam\`, \`camera\`, and \`Cameras\`.

Agenda:
${args.agenda}`,
    );
  }

  if (name === 'bulk_edit_rundown') {
    return userPrompt(
      'Apply a bulk change across the rundown',
      `Apply the following bulk edit to the current Ontime rundown: "${args.instruction}"

Strategy:
1. Call ontime_list_rundowns and identify the target rundown. If the user wants a background rundown, pass its \`rundownId\` in all entry read/write calls instead of loading it.
2. Call ontime_get_rundown with the chosen \`rundownId\` to see the current events, their IDs, and field values.
3. Call ontime_get_timer_state. If playback is not \`stop\` and the target is the loaded rundown, explain that MCP edits affect the live rundown and ask the user to confirm before changing it. If the target is a background rundown, it can be edited without interrupting playback.
4. Determine which event IDs are affected by the instruction.
5. If the user asks to group existing top-level entries: call ontime_group_entries once with { ids, title/note/colour/custom/targetDuration as needed, rundownId }.
6. If the user asks to dissolve a group: call ontime_ungroup_entry with the group id and rundownId.
7. If every affected entry receives the SAME field values (e.g. "colour all keynotes purple", "skip all breaks"): call ontime_batch_update_entries once with { ids, data, rundownId }.
8. If each event needs DIFFERENT field values (e.g. "shift everything 30 minutes later"): check first if events use linkStart. If they do, changing the anchor event's timeStart or duration can cascade to linked followers — you may only need to update one event. Otherwise, compute the new values per event and call ontime_update_entry for each.

Time shift mechanics:
- All time fields are milliseconds from midnight; compute arithmetic before calling the tools.
- timeEnd - timeStart = duration. When shifting times, decide whether to keep duration fixed (timeEnd moves with timeStart) or keep timeEnd fixed (duration shrinks). Provide only the fields you intend to change — the server infers the strategy from which fields are present.
- For "shift everything N minutes later": update timeStart and timeEnd per event (or just timeStart on the anchor event of a linkStart chain). Do not use ontime_batch_update_entries for this unless every target event should receive the exact same timeStart/timeEnd values.

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
- Events with missing \`cue\` or \`title\`: these are usually worth checking, but not necessarily errors
- Events with \`duration\` of 0 or negative
- Events with \`gap < 0\`: overlaps the previous timed event and is a conflict
- Large unexplained positive gaps between consecutive timed events (> 30 min): check whether these are intentional
- Events where \`timeEnd < timeStart\`: these cross midnight; confirm this is intentional
- Events whose \`timeStart\` is the same as or earlier than the previous playable event's \`timeStart\`: Ontime schedules these on the next day; confirm this is intentional

Timing and linking:
- \`metadata.totalDays > 0\`: show spans midnight — confirm this is intentional
- \`metadata.totalDelay !== 0\`: active delay entries are shifting the schedule by this many ms; report the net shift
- Events with \`linkStart: true\` that are first in the rundown (no predecessor to link to)
- Events with \`countToEnd: true\`: confirm the operator expects countdowns to target scheduled end time instead of event duration, especially if starts can drift.

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
1. Call ontime_list_rundowns and identify the target rundown. If the user wants a background rundown, pass its \`rundownId\` in all entry read/write calls instead of loading it.
2. Call ontime_get_rundown with the chosen \`rundownId\` to see the current order, groups, and event fields.
3. Call ontime_get_timer_state. If playback is not \`stop\` and the target is the loaded rundown, explain that MCP reorders the live rundown and ask the user to confirm before changing it. If the target is a background rundown, it can be edited without interrupting playback.
4. Note which events are inside groups (check each group's \`entries\` array vs the top-level \`order\` array).
5. If the instruction groups existing top-level entries into a new group, call ontime_group_entries with the selected IDs and any group metadata.
6. If the instruction dissolves a group, call ontime_ungroup_entry with that group ID.
7. Otherwise compute the target arrangement as a sequence of moves.
8. For each event that needs to move, call ontime_reorder_entry:
   - \`order: 'before'\` or \`'after'\` — places the event as a sibling next to destinationId
   - \`order: 'insert'\` — places the event inside a group (destinationId must be the group's ID)
9. Call ontime_get_rundown again to confirm the new order.

Group awareness:
- Events inside a group appear in the group's \`entries\` array, not in the top-level \`order\`.
- To create a group from existing top-level entries, prefer ontime_group_entries over creating an empty group and moving items one by one.
- To dissolve a group, use ontime_ungroup_entry.
- To move an event out of a group, reorder it before/after a top-level entry.
- To move an event into a group, use \`order: 'insert'\` with the group as destinationId.
- A group's \`targetDuration\` is a planning hint only — moving events in or out does not break anything.

Efficiency tip: plan moves in the direction of the target position to minimise reorder calls. Avoid moving the same event twice — compute the full target sequence before issuing any calls.`,
    );
  }

  if (name === 'manage_custom_fields') {
    return userPrompt(
      'List, create, rename, recolour, or delete custom field definitions',
      `Manage the project-level custom field definitions for this Ontime project: "${args.instruction}"

Custom fields are project-scoped. They appear as columns in the cuesheet and can be set on any event, milestone, or group. Changes apply to all rundowns in the project.

Steps:
1. Call ontime_get_custom_fields to see what fields already exist. This is mandatory before creating — to avoid duplicates such as "Cam", "camera", and "Cameras".
2. Carry out the instruction using the tools below. Confirm destructive changes (rename, delete) with the user before calling.

Creating a field:
- Call ontime_create_custom_field with { label, type, colour }.
- label: human-readable name (alphanumeric with spaces). The key is auto-derived: spaces → underscores (e.g. "Camera Angle" → "Camera_Angle"). Confirm the derived key with the user before creating.
- type: "text" for short string values, "image" for image URLs. Cannot be changed after creation.
- colour: hex colour (#RRGGBB) used to visually identify this column in the cuesheet. Ask the user what colour to use if not specified.
- Returns: { key, customFields } — use the returned key when setting values on entries.

Renaming or recolouring a field:
- Call ontime_update_custom_field with { key, label?, colour? }.
- Warning: changing the label changes the derived key and cascades to all entry references in all rundowns. Confirm with the user before renaming.
- The field type cannot be changed.

Deleting a field:
- Call ontime_delete_custom_field with { key }.
- Warning: this permanently removes the field definition and its values from every entry in all rundowns. Confirm with the user before deleting.

After any mutation, call ontime_get_custom_fields again to confirm the result and show the user the updated field list with their keys.`,
    );
  }

  throw new Error(`Unknown prompt: ${name}`);
}
