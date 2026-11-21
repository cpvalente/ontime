import { EntryId, OntimeEntry, PhaseThresholds, isOntimeGroup } from 'ontime-types';

/**
 * Resolves which entry the editor should show for the current selection
 * - the cursor, if it is part of the selection and still exists
 * - otherwise the first selected entry that still exists
 */
export function getEditTarget(
  selectedEvents: Set<EntryId>,
  cursor: EntryId | null,
  entries: Record<EntryId, OntimeEntry>,
): OntimeEntry | null {
  if (cursor && selectedEvents.has(cursor) && entries[cursor]) {
    return entries[cursor];
  }

  for (const id of selectedEvents) {
    if (entries[id]) {
      return entries[id];
    }
  }

  return null;
}

/**
 * - warning-exceeds-duration: the timer starts in warning
 * - danger-exceeds-warning: the timer skips warning, going straight to danger
 */
export type PhaseThresholdIssue = 'warning-exceeds-duration' | 'danger-exceeds-warning';

export function getPhaseThresholdIssue(
  { timeWarning, timeDanger }: { timeWarning: number; timeDanger: number },
  duration: number,
): PhaseThresholdIssue | null {
  if (timeDanger > timeWarning) return 'danger-exceeds-warning';
  if (duration > 0 && timeWarning >= duration) return 'warning-exceeds-duration';
  return null;
}

/**
 * The thresholds an event inherits from its group, null inherits the project
 */
export function getGroupThresholds(
  entries: Record<EntryId, OntimeEntry>,
  parentId: EntryId | null,
): PhaseThresholds | null {
  const parent = parentId ? entries[parentId] : undefined;
  return isOntimeGroup(parent) ? parent.phaseThresholds : null;
}
