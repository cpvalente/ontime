import type { CustomFields } from 'ontime-types';

import { AppMode } from '../../../ontimeConfig';
import { makeCuesheetColumns } from '../../../views/cuesheet/cuesheet-table/cuesheet-table-elements/cuesheetColsFactory';
import type { CuesheetColumnDef } from '../../../views/cuesheet/cuesheet-table/cuesheetTable.features';

/**
 * Creates column definitions for the rundown table
 * Reuses cuesheetColsFactory with preset=undefined for full access
 */
export function makeRundownColumns(customFields: CustomFields): CuesheetColumnDef[] {
  // When preset=undefined, factory defaults to fullRead=true, fullWrite=true
  // canWrite is determined by editorMode (AppMode.Edit vs AppMode.Run)
  return makeCuesheetColumns(customFields, AppMode.Edit, undefined);
}
