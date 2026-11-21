import type { DatabaseModel, PhaseThresholds } from 'ontime-types';

import { is } from '../../../utils/is.js';

const v4Defaults = { timeWarning: 120000, timeDanger: 60000 } as const;
type PhaseField = keyof typeof v4Defaults;
const phaseFields: PhaseField[] = ['timeWarning', 'timeDanger'];

/**
 * Whether the custom fields are still a record by key, as saved before v5
 * Runs after the v3 migration, so v3 files reach it already migrated to v4
 */
export function shouldMigrateToV5(jsonData: Partial<DatabaseModel>): boolean {
  return is.object(jsonData.customFields);
}

/**
 * Migrates a project file from v4 to v5
 * - custom fields go from a record by key to a list, each field holding its key
 *   the record lists the fields in the order they were made, which becomes the user defined order
 * - event warning and danger times move to the project thresholds, see migratePhaseThresholds()
 */
export function migrateToV5(jsonData: Partial<DatabaseModel>): Partial<DatabaseModel> {
  const record: object = is.object(jsonData.customFields) ? jsonData.customFields : {};
  const customFields = Object.entries(record).map(([key, field]) => ({ ...field, key }));
  return migratePhaseThresholds({ ...jsonData, customFields });
}

/**
 * v4 saved warning and danger times on every event, v5 inherits them from the project
 * - a phase where every event holds the same time becomes the project threshold, and the events inherit it
 *   this keeps the default a user set in the v4 editor
 * - otherwise, events at the 4.x default inherit the project threshold, which keeps the 4.x default time
 * the project always gets time thresholds, so a migrated project keeps the times it had, not the v5 percentages
 */
function migratePhaseThresholds(jsonData: Partial<DatabaseModel>): Partial<DatabaseModel> {
  if (!is.object(jsonData.rundowns)) return jsonData;

  const events = Object.values(jsonData.rundowns).flatMap((rundown: unknown) =>
    is.object(rundown) && is.objectWithKeys(rundown, ['entries']) && is.object(rundown.entries)
      ? Object.values(rundown.entries).filter(isEvent)
      : [],
  );

  const inherited: Record<PhaseField, number> = { ...v4Defaults };
  for (const field of phaseFields) {
    const shared = getSharedTime(events, field);
    if (shared !== null) inherited[field] = shared;
  }

  const migrated: Partial<DatabaseModel> = {
    ...jsonData,
    rundowns: mapObject(jsonData.rundowns, (rundown) =>
      inheritThresholds(rundown, inherited),
    ) as DatabaseModel['rundowns'],
  };

  if (is.object(jsonData.settings)) {
    const phaseThresholds: PhaseThresholds = {
      warning: { unit: 'time', value: inherited.timeWarning },
      danger: { unit: 'time', value: inherited.timeDanger },
    };
    migrated.settings = { ...jsonData.settings, phaseThresholds } as DatabaseModel['settings'];
  }
  return migrated;
}

type MaybeEvent = Record<string, unknown> & { type: 'event' };

function isEvent(entry: unknown): entry is MaybeEvent {
  return is.object(entry) && is.objectWithKeys(entry, ['type']) && entry.type === 'event';
}

function isTime(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** the time every event holds for a phase, null if the events differ or there are none */
function getSharedTime(events: MaybeEvent[], field: PhaseField): number | null {
  const first = events[0]?.[field];
  if (!isTime(first)) return null;
  return events.every((event) => event[field] === first) ? first : null;
}

function mapObject(value: object, transform: (entry: unknown) => unknown): object {
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, transform(entry)]));
}

function inheritThresholds(rundown: unknown, inherited: Record<PhaseField, number>): unknown {
  if (!is.object(rundown) || !is.objectWithKeys(rundown, ['entries']) || !is.object(rundown.entries)) return rundown;
  const entries = mapObject(rundown.entries, (entry) => {
    if (!isEvent(entry)) return entry;
    const patched: MaybeEvent = { ...entry };
    for (const field of phaseFields) {
      if (entry[field] === inherited[field]) patched[field] = null;
    }
    return patched;
  });
  return { ...rundown, entries };
}
