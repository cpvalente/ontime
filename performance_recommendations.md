# Performance Improvement Recommendations for Rundown Service

Based on detailed analysis of event lookup functions, state change broadcasting, and event update notifications, the following are the top 3 most impactful and actionable performance improvement recommendations:

## 1. Optimize `deepEqual` for Event Objects in `broadcastResult` Decorator

*   **Problem:**
    The `broadcastResult` decorator uses `deepEqual` to compare previous and current states for various slices, including up to four event objects (`eventNow`, `publicEventNow`, `eventNext`, `publicEventNext`). `OntimeEvent` objects can be complex (containing scripts, parts arrays, etc.), making these frequent `deepEqual` calls potentially expensive, especially with many decorated methods being called often. This can lead to increased CPU usage and slower state broadcast processing.

*   **Proposed Solution (Mid-Term Action from `deepEqual_analysis.txt`):**
    Introduce a `_version` number or `_lastModified` timestamp to `OntimeEvent` objects. This identifier should be updated systematically whenever an event undergoes a significant change that clients need to be aware of (e.g., changes to timing, content, or critical metadata).
    The comparison in `broadcastResult` for event objects would then become a simple primitive comparison:
    `prevEvent?._version !== newEvent?._version`.

    *Short-Term Alternative:* Implement a more targeted `eventDataChanged(prev, next)` function that compares only a curated list of essential fields for client updates, avoiding deep comparison of potentially large fields like `script` or `notes` if they don't always trigger UI changes for all views.

*   **Expected Performance Benefit:**
    Significant reduction in CPU time spent on state comparison within `broadcastResult`. Change detection for events would become O(1) (for version/timestamp) or much faster with a targeted comparison function, instead of O(complexity_of_event_object). This will lead to faster processing of state updates and reduced overhead after method calls wrapped by `broadcastResult`.

## 2. Optimize Event ID Lookups in Ordered Arrays

*   **Problem:**
    Functions like `findPreviousPlayableId` and `findNextPlayableId` in `rundownService.utils.ts` use `Array.prototype.findIndex` on `playableEventsOrder` to locate the current event's index. This is an O(N) operation (where N is the number of playable events). For rundowns with a large number of events, these lookups can become slow, impacting the performance of navigation actions (e.g., load/start next/previous event).

*   **Proposed Solution (from `event_lookup_analysis.txt`):**
    Pre-compute and maintain a `Map<EntryId, number>` where keys are event IDs and values are their respective indices within the `playableEventsOrder` array. This map would be generated once when `playableEventsOrder` is established or modified.
    The lookup for `currentEventId` in the functions would then change from `playableEventsOrder.findIndex(...)` to `idToIndexMap.get(currentEventId)`.

*   **Expected Performance Benefit:**
    Reduces the time complexity of finding an event's index in `playableEventsOrder` from O(N) to O(1) on average. This will speed up functions critical for event navigation, making the system more responsive, especially with large rundowns. The main trade-off is the memory for the map and the need to regenerate/update it when `playableEventsOrder` changes.

## 3. Enhance Granularity of `notifyOfChangedEvents` Updates

*   **Problem:**
    The `notifyOfChangedEvents` method in `RuntimeService.ts` can trigger broad state updates (e.g., `runtimeState.updateAll()`) even for minor changes to events. For instance, if metadata of an `eventNext` changes, it might cause a full reload of `eventNow`, `eventNext`, and their public counterparts. This is inefficient and can lead to unnecessary processing and data broadcasting.

*   **Proposed Solution (Hybrid from `notifyOfChangedEvents_analysis.txt`):**
    1.  **Enrich Change Notifications:** Modify the system to provide more detailed information about event changes to `notifyOfChangedEvents`, not just `affectedIds`. This could include `changedFields` or a `changeType` (e.g., 'metadata', 'timing').
    2.  **Refine `notifyOfChangedEvents` Logic:** Use this detailed change information to make more granular decisions. If only non-critical metadata of `eventNow` or `eventNext` changes, call more lightweight update functions in `runtimeState` (e.g., `runtimeState.updateEventMetadata(eventId, newPartialData)`).
    3.  **Introduce Granular `runtimeState` Updaters:** Add new methods to `runtimeState` (e.g., `updateEventMetadata`) designed to apply these partial updates to the state without triggering a full reload of related event data.

*   **Expected Performance Benefit:**
    Reduced unnecessary processing and data broadcasting. By only updating the precise parts of the state that changed (e.g., just the notes of an event, or just the `endAction`), the system avoids heavy operations like `updateAll` or even `updateLoaded` when not strictly necessary. This leads to a more efficient runtime, faster client updates for minor changes, and potentially less data over websockets. The main challenge is the increased complexity in tracking and applying changes.
