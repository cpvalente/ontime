import type { ImportedFields, RundownImportMode } from 'ontime-types';
import type { ImportMap } from 'ontime-utils';

import { makeStageKey } from '../../../../../../common/utils/localStorage';
import { normaliseColumnName } from './spreadsheetImportUtils';

export type MappingWarning = {
  kind: 'duplicate' | 'missing' | 'invalid-name' | 'name-collision';
};

export type BuiltInFieldDef = {
  label: string;
  importKey: keyof Omit<ImportMap, 'worksheet' | 'custom'>;
  defaultHeader: string;
};

export const builtInFieldDefs = [
  { label: 'Flag', importKey: 'flag', defaultHeader: 'flag' },
  { label: 'Start', importKey: 'timeStart', defaultHeader: 'time start' },
  { label: 'Link start', importKey: 'linkStart', defaultHeader: 'link start' },
  { label: 'End', importKey: 'timeEnd', defaultHeader: 'time end' },
  { label: 'Duration', importKey: 'duration', defaultHeader: 'duration' },
  { label: 'Cue', importKey: 'cue', defaultHeader: 'cue' },
  { label: 'Title', importKey: 'title', defaultHeader: 'title' },
  { label: 'Count to end', importKey: 'countToEnd', defaultHeader: 'count to end' },
  { label: 'Skip', importKey: 'skip', defaultHeader: 'skip' },
  { label: 'Note', importKey: 'note', defaultHeader: 'notes' },
  { label: 'Colour', importKey: 'colour', defaultHeader: 'colour' },
  { label: 'End action', importKey: 'endAction', defaultHeader: 'end action' },
  { label: 'Timer type', importKey: 'timerType', defaultHeader: 'timer type' },
  { label: 'Time warning', importKey: 'timeWarning', defaultHeader: 'warning time' },
  { label: 'Time danger', importKey: 'timeDanger', defaultHeader: 'danger time' },
  { label: 'ID', importKey: 'id', defaultHeader: 'id' },
] as const satisfies readonly BuiltInFieldDef[];

export type ImportFormValues = {
  worksheet: string;
  builtIn: Array<{ header: string; enabled: boolean }>;
  custom: Array<{ ontimeName: string; importName: string }>;
};

export function createDefaultFormValues(): ImportFormValues {
  return {
    worksheet: 'event schedule',
    builtIn: builtInFieldDefs.map((def) => ({
      header: def.defaultHeader,
      enabled: def.defaultHeader.trim().length > 0,
    })),
    custom: [],
  };
}

/**
 * Whether the mapping supplies an ID column. Merge matches entries by ID, so without one every
 * imported entry gets a fresh id and nothing can reconcile with the current rundown.
 */
export function isIdColumnMapped(values: ImportFormValues): boolean {
  const idIndex = builtInFieldDefs.findIndex((def) => def.importKey === 'id');
  const field = values.builtIn[idIndex];
  return Boolean(field?.enabled && field.header.trim());
}

function sanitiseOntimeCustomFieldLabel(importName: string): string {
  // Replace punctuation with spaces, then collapse repeated whitespace into single spaces.
  const sanitised = importName
    .replace(/[^a-z0-9 ]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return sanitised;
}

export function getResolvedCustomFields(customFields: ImportFormValues['custom']): ImportFormValues['custom'] {
  return customFields.map(({ importName }) => {
    const trimmedImportName = importName.trim();

    if (!trimmedImportName) {
      return { importName: '', ontimeName: '' };
    }

    const baseLabel = sanitiseOntimeCustomFieldLabel(trimmedImportName);
    if (!baseLabel) {
      return {
        importName: trimmedImportName,
        ontimeName: '',
      };
    }

    return {
      importName: trimmedImportName,
      ontimeName: baseLabel,
    };
  });
}

/**
 * Returns the fields the import map supplies — the complete description of what the incoming data
 * provides, for both built-in and custom fields. A merge uses this to patch exactly these fields
 * onto a matched event and keep everything else (e.g. automations) untouched.
 * Import-map keys are OntimeEvent field names; `worksheet`/`custom` are meta and `id` is only used
 * for matching, not overwritten.
 */
export function getProvidedImportFields(importMap: ImportMap): ImportedFields {
  const event: string[] = [];
  for (const [key, value] of Object.entries(importMap)) {
    if (key === 'worksheet' || key === 'custom' || key === 'id') continue;
    if (typeof value === 'string' && value.trim() !== '') {
      event.push(key);
    }
  }
  return { event, custom: Object.keys(importMap.custom) };
}

export function convertToImportMap(values: ImportFormValues): ImportMap {
  const custom = getResolvedCustomFields(values.custom).reduce<Record<string, string>>(
    (accumulator, { ontimeName, importName }) => {
      if (ontimeName && importName) {
        accumulator[ontimeName] = importName;
      }
      return accumulator;
    },
    {},
  );

  const result: Record<string, unknown> = {
    worksheet: values.worksheet,
    custom,
  };

  for (let i = 0; i < builtInFieldDefs.length; i++) {
    const def = builtInFieldDefs[i];
    result[def.importKey] = values.builtIn[i].enabled ? values.builtIn[i].header : '';
  }

  return result as ImportMap;
}

function getImportMapKey(sourceKey: string) {
  return makeStageKey(`import-map:${sourceKey}`);
}

export function persistImportState(sourceKey: string, values: ImportFormValues) {
  localStorage.setItem(getImportMapKey(sourceKey), JSON.stringify(values));
}

function isPersistedFormValues(obj: unknown): obj is ImportFormValues {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const candidate = obj as Record<string, unknown>;
  return (
    typeof candidate.worksheet === 'string' &&
    Array.isArray(candidate.builtIn) &&
    candidate.builtIn.length === builtInFieldDefs.length &&
    Array.isArray(candidate.custom)
  );
}

export function getPersistedImportState(sourceKey: string): { values: ImportFormValues; isPersisted: boolean } {
  const storageKey = getImportMapKey(sourceKey);
  try {
    const persistedData = localStorage.getItem(storageKey);
    if (!persistedData) {
      return { values: createDefaultFormValues(), isPersisted: false };
    }

    const parsed: unknown = JSON.parse(persistedData);
    if (isPersistedFormValues(parsed)) {
      return { values: parsed, isPersisted: true };
    }

    // Invalid schema - delete malformed data
    localStorage.removeItem(storageKey);
    return { values: createDefaultFormValues(), isPersisted: false };
  } catch {
    // Parse error - delete corrupted data
    localStorage.removeItem(storageKey);
    return { values: createDefaultFormValues(), isPersisted: false };
  }
}

/**
 * The import mode (new / merge / override) is persisted separately from the field mapping
 * so the mapping schema guard stays untouched.
 */

/** Default import mode: replace matched elements in the current rundown */
export const defaultImportMode: RundownImportMode = 'override';

function getImportModeKey(sourceKey: string) {
  return makeStageKey(`import-mode:${sourceKey}`);
}

/** Persists the import mode for a given source */
export function persistImportMode(sourceKey: string, mode: RundownImportMode) {
  localStorage.setItem(getImportModeKey(sourceKey), mode);
}

/** Reads the persisted import mode for a source, falling back to the default when absent or invalid */
export function getPersistedImportMode(sourceKey: string): RundownImportMode {
  const persisted = localStorage.getItem(getImportModeKey(sourceKey));
  if (persisted === 'new' || persisted === 'merge' || persisted === 'override') {
    return persisted;
  }
  return defaultImportMode;
}

/**
 * Validates import mappings and generates warnings for duplicate or missing spreadsheet columns.
 */
export function getImportWarnings(
  values: ImportFormValues,
  detectedSpreadsheetColumns: string[],
): Record<string, MappingWarning | undefined> {
  const normalisedHeaders = new Set(detectedSpreadsheetColumns.map(normaliseColumnName).filter(Boolean));
  const builtInLabels = new Set(builtInFieldDefs.map((def) => def.label.toLowerCase()));
  const seenColumns = new Set<string>();
  const seenDerivedLabels = new Set<string>();
  const warnings: Record<string, MappingWarning | undefined> = {};

  // 1. check built-in fields
  for (let i = 0; i < values.builtIn.length; i++) {
    const field = values.builtIn[i];
    if (!field.enabled) continue;

    const normalised = normaliseColumnName(field.header);
    if (!normalised) continue;

    const key = `builtIn.${i}.header`;

    if (seenColumns.has(normalised)) {
      warnings[key] = { kind: 'duplicate' };
    } else if (normalisedHeaders.size > 0 && !normalisedHeaders.has(normalised)) {
      warnings[key] = { kind: 'missing' };
    }

    seenColumns.add(normalised);
  }

  // 2. check custom fields
  values.custom.forEach(({ importName }, index) => {
    const normalised = normaliseColumnName(importName);
    if (!normalised) return;

    const key = `custom.${index}.importName`;
    const sanitisedLabel = sanitiseOntimeCustomFieldLabel(importName);

    if (seenColumns.has(normalised)) {
      warnings[key] = { kind: 'duplicate' };
    } else if (!sanitisedLabel) {
      warnings[key] = { kind: 'invalid-name' };
    } else if (normalisedHeaders.size > 0 && !normalisedHeaders.has(normalised)) {
      warnings[key] = { kind: 'missing' };
    } else {
      const normalisedDerivedLabel = sanitisedLabel.toLowerCase();
      if (builtInLabels.has(normalisedDerivedLabel) || seenDerivedLabels.has(normalisedDerivedLabel)) {
        warnings[key] = { kind: 'name-collision' };
      }
    }

    seenColumns.add(normalised);
    if (sanitisedLabel) {
      seenDerivedLabels.add(sanitisedLabel.toLowerCase());
    }
  });

  return warnings;
}
