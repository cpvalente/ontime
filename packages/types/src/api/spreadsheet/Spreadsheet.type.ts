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
