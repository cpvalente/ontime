# Product screenshots

Run from the repository root after installing dependencies and the Playwright Chromium browser:

```sh
pnpm --filter ontime-ui build
node e2e/screenshots/capture.mjs
```

The command starts a separate server on a free port with a temporary data directory, loads the
built-in demo project, stages playback, and captures the navigation views and two feature examples at 1920 × 1080.
The server and temporary data directory are cleaned up when the command finishes.

Outputs go to `automated-screenshots/demo/` (ignored by Git): thirteen numbered PNGs, an HTML gallery,
an overview image, and a JSON report. Editor Control, Planning, and Tracking each have a capture.
On failure, the last browser screen is saved as `failure.png`.

## Keep the demo as the source

Improve `apps/server/src/models/demoProject.ts` and `demoRundowns.ts` when the demo lacks useful
content. The capture script must not patch the demo project or rundown. It verifies that capture
leaves those unchanged. Only runtime controls and supported view options are configured:

- Playback history starts with Pre-show Countdown and Welcome, followed by Session 1.
- Session 2 is the next flagged event; Control and Tracking show its flag countdown.
- Auxiliary timers use short names: Q&A, Break and Reset. Only Q&A runs; Break and Reset are ready but stopped.
- Planning and Tracking use Table view; Control uses List view.
- Each editor capture reveals the current event through the app's navigation and checks it sits near the top.
- Operator shows notes and the Video Notes custom field; Countdown subscribes to the upcoming demo events.
- The secondary message asks the speaker to slow down for the interpreters.
- The main timer message is empty and disabled; only the secondary message is enabled, using the default Timer view.
- Timeline uses fixed-size mode to show the whole rundown, with event notes as secondary text.
- Controls are blurred before capture so no input or button has a focus outline.

The clock is fixed at **17 October 2026, 11:32:45 Europe/Oslo**, with **27:15** remaining in Session 1.
`clock.mjs` overrides Date only in the spawned screenshot server, leaving normal server behaviour
unchanged. Before each capture the clock briefly advances one second and returns to the fixed time:
this refreshes the client's clock baseline so its stale-clock fallback does not drift. Capture
checks the displayed clock, the upcoming flag, image loading, browser errors, and identical runtime
state before and after the set, including restoration after the delayed scenario.

## Website and documentation coverage

The default run produces **13 captures**: the eleven standard views above and two supplemental
feature examples. Use the standard captures for both the website and the documentation's plain
view screenshots; no second set is needed for documentation. Keep existing filenames 01–11 stable.

| Capture                         | Intended use                                                  | Staged state                                                                                                       |
| ------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 01–11: standard views           | Website view gallery and unannotated documentation view pages | Approved on-time demo profile                                                                                      |
| 12: Cuesheet — Video department | Website collaboration example                                 | Edit mode; schedule, notes and Video Notes visible; Audio Notes and PowerPoint fields hidden through table options |
| 13: Editor — Tracking delayed   | Website delay-management example                              | Tracking Table with Show delayed times enabled and five minutes added to Session 1                                 |

The department example configures visible columns only; it does not represent a restricted-access
sharing preset. Widen Title and Note by 200px each and Video Notes by 300px using the table
resize handles so the useful columns fill the frame. Keep the populated demo content and clear
focus after menus have closed and clock refreshes have finished.

The delayed example keeps the same fixed clock, flags, auxiliary timers and messages. Its remaining
time is **32:15**, with five minutes added and later expected times. The script checks the offset
and expected finish, records each capture's scenario and runtime, removes the added time after
capture, and requires the final runtime to match the original baseline. Project/rundown data stays
unchanged throughout. Review both supplemental images as well as the core visual checks above.

Multiple-rundown examples and annotated documentation images are outside this set. Updating image
placements on the website or documentation is a separate task; generating these files does not
publish them.
