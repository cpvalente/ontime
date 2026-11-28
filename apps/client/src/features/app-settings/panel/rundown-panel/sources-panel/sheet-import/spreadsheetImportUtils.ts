import type { ImportFormValues } from './importMapUtils';

export function normaliseColumnName(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

/**
 * Derives the autocomplete option state for spreadsheet header mapping inputs.
 * Walks the enabled built-in mappings and all custom mappings, normalizes
 * their assigned header names, and returns both the unique worksheet headers to
 * offer in the UI and the subset already assigned to any field.
 */
export function deriveHeaderOptionsState(values: ImportFormValues, headers: string[]) {
  const seenHeaders = new Set<string>();
  const sampleHeaders: string[] = [];

  for (const header of headers) {
    const normalized = normaliseColumnName(header);
    if (!normalized || seenHeaders.has(normalized)) {
      continue;
    }

    seenHeaders.add(normalized);
    sampleHeaders.push(header.trim());
  }

  const assignedColumns = new Set<string>();

  for (const field of values.builtIn) {
    if (!field.enabled) continue;
    const normalized = normaliseColumnName(field.header);
    if (normalized) {
      assignedColumns.add(normalized);
    }
  }

  for (const { importName } of values.custom) {
    const normalized = normaliseColumnName(importName);
    if (normalized) {
      assignedColumns.add(normalized);
    }
  }

  const assignedHeaders = new Set(sampleHeaders.filter((header) => assignedColumns.has(normaliseColumnName(header))));

  return { sampleHeaders, assignedHeaders };
}
