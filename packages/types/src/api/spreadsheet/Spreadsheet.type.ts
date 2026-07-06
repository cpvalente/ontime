import type { CustomFields } from '../../definitions/core/CustomFields.type.js';
import type { Rundown } from '../../definitions/core/Rundown.type.js';
import type { RundownSummary } from '../rundown-controller/BackendResponse.type.js';

export type SpreadsheetWorksheetMetadata = {
  worksheet: string;
  headers: string[];
};

export type SpreadsheetWorksheetOptions = {
  worksheets: string[];
  metadata: SpreadsheetWorksheetMetadata | null;
  title?: string;
};

export type SpreadsheetPreviewResponse = {
  rundown: Rundown;
  customFields: CustomFields;
  summary: RundownSummary;
};

/**
 * How elements matched by id should be reconciled when importing into an existing rundown
 * - override: imported data replaces the whole matched element
 * - merge: imported data updates only the fields the spreadsheet supplied, keeping the rest
 */
export type RundownImportMergeStrategy = 'override' | 'merge';

/**
 * What an import does with the data
 * - override / merge apply the import onto an existing rundown (reconciling matched elements)
 * - new creates a fresh rundown from the import
 */
export type RundownImportMode = RundownImportMergeStrategy | 'new';

/**
 * The fields an import supplies, i.e. the columns the spreadsheet maps.
 * This is the complete description of what the incoming data provides, so a merge can apply exactly
 * these fields onto a matched event and keep everything else (e.g. automations) untouched.
 */
export type ImportedFields = {
  /** mapped OntimeEvent fields (the import-map keys are OntimeEvent field names) */
  event: string[];
  /** mapped custom field keys */
  custom: string[];
};

/**
 * Payload for the rundown import endpoint
 * - override / merge apply the import onto the target rundown (targetRundownId required)
 * - new creates a fresh rundown from the import
 */
export type RundownImportPayload = {
  mode: RundownImportMode;
  /** required when mode is 'override' or 'merge' */
  targetRundownId?: string;
  rundown: Rundown;
  customFields: CustomFields;
  /** the fields the spreadsheet supplies; used by 'merge' to patch only those on a matched event */
  providedFields?: ImportedFields;
};
