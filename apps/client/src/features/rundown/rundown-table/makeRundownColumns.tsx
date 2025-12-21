import type { ColumnDef } from '@tanstack/react-table';
import type { CustomFields } from 'ontime-types';

import type { ExtendedEntry } from '../../../common/utils/rundownMetadata';
import { AppMode } from '../../../ontimeConfig';
import { makeCuesheetColumns } from '../../../views/cuesheet/cuesheet-table/cuesheet-table-elements/cuesheetColsFactory';

/**
 * Creates column definitions for the rundown table
 * Reuses cuesheetColsFactory with preset=undefined for full access
 */
export function makeRundownColumns(customFields: CustomFields): ColumnDef<ExtendedEntry>[] {
  // When preset=undefined, factory defaults to fullRead=true, fullWrite=true
  // canWrite is determined by editorMode (AppMode.Edit vs AppMode.Run)
  return makeCuesheetColumns(customFields, AppMode.Edit, undefined);
}
