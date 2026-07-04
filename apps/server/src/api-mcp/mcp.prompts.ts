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
    name: 'tidy_rundown',
    description:
      'Audit the rundown for readability (colours, grouping, cue naming, custom field usage) and propose improvements',
    arguments: [
      {
        name: 'focus',
        description: 'Optional area to focus on, e.g. "colours only" or "grouping"',
        required: false,
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
- Controls what happens when the event's timer reaches zero and can have surprising effect. Use only if the user explicitly asks for it.
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

Structure and colours:
- Read the ontime://style-guide resource before deciding on structure or colours.
- Propose a group per agenda section (morning block, keynotes, breaks) rather than a flat list — in ontime_batch_create_entries this is just a group entry with \`children\`.
- Ask the user what colour convention they use; if they have none, propose one from the default Ontime palette in the style guide: calm hues for normal content, red only for attention items, orange for changeovers, dark tone on a group with the light tone of the same hue on its children. Colours are hex strings: \`#RRGGBB\`.

Custom fields (custom):
- Call ontime_get_custom_fields for the project's field keys (cuesheet-style columns such as camera, graphics, speaker).
- Store values per entry at \`custom: { <fieldKey>: <value> }\` — keys are case-sensitive.
- Reuse an existing field when it covers the concept (avoid duplicates such as \`Cam\`, \`camera\`, \`Cameras\`); when the agenda carries structured data with no matching field (speakers, locations), create it with ontime_create_custom_field and use the returned key — no confirmation needed.

After creating the rundown, read ontime://views and suggest how the team can follow it — e.g. a timer view for speakers, a backstage view for crew, or an operator view subscribed to a department custom field.

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
- Long segments scheduled back-to-back with no changeover or buffer between them: one overrun will cascade — suggest a buffer event
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

Readability (report at INFO level; see ontime://style-guide for the conventions):
- Colour usage without a consistent convention, or key segments left uncoloured
- Long runs of related ungrouped events that would read better as groups
- Duplicate cues (cues are automation handles and should be unique) or mixed cue naming conventions
- Structured department data in titles/notes that belongs in custom fields
- If several readability issues surface, suggest running the tidy_rundown prompt to fix them systematically

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

  if (name === 'tidy_rundown') {
    const focus = args.focus ? `\nFocus specifically on: "${args.focus}".` : '';
    return userPrompt(
      'Audit and improve rundown readability',
      `Audit the current Ontime rundown for readability and tidiness, then propose improvements.${focus}

Steps:
1. Read the ontime://style-guide resource — it defines the conventions to audit against, including the standard colour palette.
2. Call ontime_list_rundowns and identify the target rundown. If the user wants a background rundown, pass its \`rundownId\` in all entry read/write calls instead of loading it.
3. Call ontime_get_rundown with the chosen \`rundownId\`, and ontime_get_custom_fields for the project field definitions.
4. Call ontime_get_timer_state. If playback is not \`stop\` and the target is the loaded rundown, explain that MCP edits affect the live rundown and ask the user to confirm before changing it.

Audit for:
- Colour consistency: entries coloured outside a discernible convention, missing colours on key segments, red/orange used for normal content (the style guide reserves them for attention items and changeovers), or group/children colours that ignore the dark/light tone pairing. Prefer the default Ontime palette.
- Grouping: long runs (roughly 4+) of related consecutive top-level events that would read better as a named group; groups missing \`targetDuration\`.
- Buffers: long segments back-to-back with no changeover event between them; propose short buffer events so one overrun cannot cascade.
- Cue naming: mixed conventions (numeric vs semantic) without apparent intent, duplicate cues, or gaps that suggest mistakes. Remember cues are automation handles — renaming them can break external triggers, so flag renames explicitly.
- Data in the wrong place: structured department data buried in titles or notes (e.g. "CAM 2", "GFX: lower third") that belongs in a custom field; overlong titles (over ~50 chars).
- Entry types: zero-duration events that should be milestones; milestones that carry timing expectations and should be events.
- Flags: \`flag: true\` on many events dilutes its meaning — critical markers only.

Then:
5. Present the findings as a short, scannable proposal (what changes, on which entries, and why) and WAIT for the user to approve before mutating anything. Be concise — a tight list beats prose.
6. Apply approved changes with the cheapest calls: ontime_group_entries to group existing entries, ontime_batch_update_entries when several entries get the same values (e.g. recolouring), ontime_update_entry for per-entry changes, ontime_create_custom_field when moving data into a new field.
7. Finish by reading ontime://views and suggesting views that put the improved structure to work — e.g. an operator view subscribed to a department custom field, or a cuesheet for cross-department editing.`,
    );
  }

  if (name === 'manage_custom_fields') {
    return userPrompt(
      'List, create, rename, recolour, or delete custom field definitions',
      `Manage the project-level custom field definitions for this Ontime project: "${args.instruction}"

Custom fields are project-scoped. They appear as columns in the cuesheet and can be set on any event, milestone, or group. Changes apply to all rundowns in the project.

Steps:
1. Call ontime_get_custom_fields to see what fields already exist. Reuse an existing field when it covers the concept — avoid duplicates such as "Cam", "camera", and "Cameras".
2. Carry out the instruction using the tools below. Creating a field is non-destructive — do it directly. Confirm destructive changes (rename, delete) with the user before calling.

Creating a field:
- Call ontime_create_custom_field with { label, type, colour }.
- label: human-readable name (letters, numbers and spaces). The key is auto-derived: spaces → underscores (e.g. "Camera Angle" → "Camera_Angle").
- type: "text" for short string values, "image" for image URLs. Cannot be changed after creation.
- colour: hex colour (#RRGGBB) used to visually identify this column in the cuesheet. If unspecified, pick one from the default Ontime palette matching the department.
- Returns: { key, customFields } — use the returned key when setting values on entries.

Renaming or recolouring a field:
- Call ontime_update_custom_field with { key, label?, colour? }.
- Warning: changing the label changes the derived key and cascades to all entry references in all rundowns. Confirm with the user before renaming.
- The field type cannot be changed.

Deleting a field:
- Call ontime_delete_custom_field with { key }.
- Warning: this permanently removes the field definition and its values from every entry in all rundowns. Confirm with the user before deleting.

After any mutation, call ontime_get_custom_fields again to confirm the result and show the user the updated field list with their keys.

When a field was created for a department (camera, graphics, audio…), read ontime://views and offer the views that surface it: the cuesheet shows the field as a column for cross-department editing, and the operator view can display or highlight it for that department, e.g. /op?main=title&secondary-src=custom-<key>&subscribe=<key>.`,
    );
  }

  throw new Error(`Unknown prompt: ${name}`);
}
