import { defaultCss } from '../bundle/bundledCss.js';
import { defaultDemoHtml } from '../bundle/bundledDemoHtml.js';

/**
 * Agent-facing Ontime guidance documents.
 *
 * These markdown resources teach agents rundown craft (ontime://style-guide),
 * Ontime's view ecosystem (ontime://views) and how to customise views (ontime://views/customise).
 * Guidance should be concise and clear — verbosity distracts agents and users alike. Keep each document short.
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

## Timer view parameters

Per-screen look, without changing other screens:
- \`keyColour\`, \`timerColour\`: background and timer colour as hex without \`#\`, eg: \`keyColour=0b1f3a\`. \`timerColour\` also replaces the warning and danger colours.
- \`font\`: a font installed on the screen's device.
- \`hideClock\`, \`hideCards\`, \`hideProgress\`, \`hideMessage\`, \`hideSecondary\`, \`hideLogo\`: \`=true\` hides that element.

Example for a branded stage screen without the clock:
\`/timer?keyColour=0b1f3a&timerColour=ff7a1a&hideClock=true\`

## URL presets

Presets bundle a configured view under a short alias (e.g. \`/camera-op\`), optionally shown in the nav menu. Managed in **Editor → Sharing and reporting → URL Presets**. When recommending a configured view, spell out the view and query string and suggest saving it as a preset.
Docs: https://docs.getontime.no/features/url-presets/

## Custom views

For branding or layouts beyond the built-in options: users upload a single \`index.html\` in **Editor → Settings → Custom views**, which Ontime serves at \`/external/<name>/\`; it can use Ontime's APIs for live data. Recommend for sponsor branding, unusual layouts, or LED wall graphics.
To restyle views or write a custom view, read \`ontime://views/customise\`.
Docs: https://docs.getontime.no/features/custom-views/
`;

/**
 * Builds ontime://views/customise around the user's current CSS override
 */
export function makeViewsCustomiseMarkdown(userCss: string, overrideEnabled: boolean): string {
  const currentCss =
    userCss.trim() === defaultCss.trim()
      ? 'Unchanged from the example CSS.'
      : `\`\`\`css
${userCss.trim()}
\`\`\``;

  return `# Customising Ontime views

Users ask to change how their screens look; they rarely know how Ontime does it. Pick the narrowest tool for the request:

1. **One screen**: use the view's URL options (see \`ontime://views\`), eg: \`/timer?keyColour=0b1f3a&timerColour=ff7a1a\`. Give the link; it changes only the screens that open it and is undone by dropping the options. Paths are relative to the address the user opens Ontime at.
2. **Every screen of a view, or every screen**: apply CSS with \`ontime_set_css_override\`. It changes the display views, the operator view and URL presets of them at once, not the editor, cuesheet or custom views. Timer colours for every screen can also be set in **Editor → Settings → View settings**.
3. **A layout the views cannot give**: build a custom view from \`ontime://views/custom-view-template\`.

Talk about the result, not the code: say what will look different and on which screens. Do not show CSS unless the user asks for it.

## Restyle with CSS

1. The example CSS below is a sample light theme, not Ontime's defaults: copy only the variables and rules the change needs, never the whole example. Its \`--*-override\` variables in \`:root\` cover colours, fonts and the timer states for every view.
2. To change one view only, scope rules under its root class: \`.stage-timer\` (timer), \`.backstage\`, \`.countdown\`, \`.studio\` and \`.project\` (project info). If you can browse, open the view (eg: \`/timer\`) and inspect its DOM for the elements to change.
3. Before your first change, note the user's CSS and on/off state below: that is the original. Build on it rather than replacing it, unless they ask to start over. If it is off, it may be old: ask whether to bring it back or start with only the new rules. Re-read this resource before each change, as the user may have edited the CSS since.
4. Apply it with \`ontime_set_css_override\`. Open screens update without a reload. While a show is running or loaded the tool refuses: ask the user whether to change the screens on air before retrying with \`force\`. Undoing on air needs \`force\` too.
5. Ask the user to look at their screens and say whether to keep the change. To undo, apply the original CSS and on/off state, unless the user asks to undo only the latest change. If you no longer have the original, eg: in a new conversation, say so and offer \`enabled: false\` for Ontime's default look. The user can also turn the override off or edit it in **Editor → Settings → View settings**.

Global classes, element nesting and \`--*-override\` variables of the display views are stable within a major version. Other selectors, and the timeline, cuesheet, operator and editor views, may change in any release.

## Example CSS

\`\`\`css
${defaultCss.trim()}
\`\`\`

## The user's current CSS override

${overrideEnabled ? 'It is on: the screens show it now.' : "It is off: the screens show Ontime's default look, not this CSS."}

${currentCss}
`;
}

/**
 * Builds ontime://views/custom-view-template with the upload rules
 */
export function makeCustomViewTemplateMarkdown(customViewMaxSizeMb: number): string {
  return `# Custom view template

For layouts the built-in views cannot give. Start from the template below, which reads live data from Ontime's websocket.
- One \`index.html\` file, at most ${customViewMaxSizeMb} MB, with only inline \`<script>\` and \`<style>\`: no external scripts, stylesheets or iframes.
- Screens may have no internet access: remove the template's remote logo and links, and keep images inline.
- Tell the user to upload it in **Editor → Settings → Custom views** under a name of lowercase letters, numbers and dashes. It is served at \`/external/<name>/\`.

\`\`\`html
${defaultDemoHtml.trim()}
\`\`\`
`;
}
