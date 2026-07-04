/**
 * Agent-facing Ontime guidance documents.
 *
 * These markdown resources teach agents rundown craft (ontime://style-guide)
 * and Ontime's view ecosystem (ontime://views). Guidance should be concise and
 * clear — verbosity distracts agents and users alike. Keep each document short.
 */

// The palette mirrors the editor colour picker swatches in
// apps/client/src/common/components/input/colour-input/SwatchSelect.tsx — keep in sync.
export const ONTIME_STYLE_GUIDE_MARKDOWN = `# Ontime rundown style guide

Conventions for tidy, scannable rundowns. Read before creating or restyling a rundown. Follow the user's own conventions when they have them; otherwise prefer these. When communicating with the user, be concise — short proposals beat long explanations.

## Structure

- Group events into blocks matching the show's segments; 10+ ungrouped events is a wall — propose groups.
- Set \`targetDuration\` on groups so operators can track time to block completion.
- Use \`milestone\` for non-timed markers (doors open, broadcast start), not zero-duration events.
- Use \`delay\` only to model schedule drift, never as padding.
- Schedule changeovers and buffers as real events (grey; orange when technical), not invisible gaps — 5–10 min between major segments stops one overrun cascading through the day.
- Model contingency segments as \`skip: true\` events: visible in the rundown, excluded from playback, one edit to activate.
- Before show day, duplicate the rundown for rehearsal so the show copy stays clean.

## Colours

Prefer Ontime's default palette — the editor's swatches — so colours look native. Each hue has a dark/light tone pair:

| Hue | Dark | Light | Use |
| --- | --- | --- | --- |
| Red | \`#ED3333\` | \`#FF7878\` | attention: curfews, hard deadlines, broadcast-critical |
| Orange | \`#FFAB33\` | \`#FFCC78\` | technical changeovers, resets |
| Green | \`#339E4E\` | \`#77C785\` | normal show content |
| Blue | \`#3E75E8\` | \`#779BE7\` | normal show content |
| Violet | \`#8064E1\` | \`#A790F5\` | normal show content |
| Grey | \`#9d9d9d\` | \`#ececec\` | breaks, housekeeping |

- Normal segments use the calm hues (green, blue, violet). Reserve red for what genuinely needs attention and orange for changeovers.
- Use tones for hierarchy: dark tone on a group, the light tone of the same hue on its child events.
- One convention per project, applied consistently.

## Cues and titles

- Cues follow ONE convention per rundown: numeric (\`1, 2, 3\` or \`10, 20, 30\`, leaving room for insertions), semantic (\`Preset\`, \`Key 1\`, \`Lunch\`), or a deliberate mix. Dense technical shows often prefix by department (\`LX1\`, \`SND2\`, \`VID3\`). Match what the rundown already uses; ask if nothing is established.
- Cues are automation handles — external systems (Companion, OSC/HTTP) trigger events by cue name. Keep them unique and stable; warn before renaming cues on an existing show.
- Title = what happens on stage, under ~50 characters. Department/tech data goes in custom fields; \`note\` is for free-text human context.

## Custom fields

- Structured per-department data (camera, graphics, audio, speaker) belongs in custom fields — one per department, coloured to match. This powers the cuesheet and operator views.
- Reuse existing fields; never create near-duplicates (\`Cam\`, \`camera\`, \`Cameras\`).
- Data repeated in titles or notes ("CAM 2") is a sign it belongs in a custom field.
- Write values to be scannable mid-show: "CAM 2 close-up", not sentences.

## Timing

- \`linkStart\` events inside a block so schedule edits propagate.
- \`flag\` sparingly — it marks critical moments and dilutes with overuse.
- Set \`timeWarning\` where a moderator would signal the speaker to wrap (commonly 5 min); \`timeDanger\` for the final push (e.g. 1 min). Scale both down for short items.
- Hard out? Backtime: build the closing items from the end with \`timeEnd\` + \`duration\` (Ontime calculates \`timeStart\`), protect their ends with \`timeStrategy: lock-end\`, and use \`countToEnd\` for true curfew items.

After tidying, read \`ontime://views\` and suggest views that use the new structure.
`;

export const ONTIME_VIEWS_MARKDOWN = `# Ontime views and sharing guide

Ontime renders the rundown into role-specific views at \`http://<host>:<port>/<view>\`. Recommend the right view when the user mentions a role, device, or sharing need. Prefer sharing live view links over exporting static documents — everyone sees the current version, ending the conflicting-copies problem of circulated spreadsheets. The agent cannot create views or presets — give exact URLs and point to the editor settings.

| View | Path | For |
| --- | --- | --- |
| Timer | \`/timer\` | speakers/presenters on stage |
| Backstage | \`/backstage\` | crew following schedule + notes |
| Operator | \`/op\` | department operators on phone/tablet |
| Cuesheet | \`/cuesheet\` | cross-department table editing |
| Timeline | \`/timeline\` | producers, whole-show overview |
| Countdown | \`/countdown\` | following selected events or a group |
| Studio clock | \`/studio\` | on-air studio environments |
| Project info | \`/info\` | sharing event logistics widely |

Most views are configured via URL parameters (editor and cuesheet in-app); the view's cog icon exposes the options and encodes them into the URL.

## Operator view parameters

- \`main\` / \`secondary-src\`: the two text lines — \`title\`, \`note\`, or \`custom-<fieldKey>\`.
- \`subscribe=<fieldKey>\`: highlight a custom field (repeatable).
- \`shouldEdit=true\`: long-press editing of the highlighted field.
- \`hidePast=true\`, \`showStart=true\`: trim and annotate the list.

Example for a camera operator:
\`/op?main=title&secondary-src=custom-Camera&subscribe=Camera&hidePast=true\`

Offer a link like this after creating a department custom field.

## URL presets

Presets bundle a configured view under a short alias (e.g. \`/camera-op\`), optionally shown in the nav menu. Managed in **Editor → Settings → URL presets**. When recommending a configured view, spell out the view and query string and suggest saving it as a preset.
Docs: https://docs.getontime.no/features/url-presets/

## Custom views

For branding or layouts beyond the built-in options: files in Ontime's \`external\` folder are served at \`/external/…\` and can use Ontime's APIs for live data. Recommend for sponsor branding, unusual layouts, or LED wall graphics.
Docs: https://docs.getontime.no/features/custom-views/
`;
