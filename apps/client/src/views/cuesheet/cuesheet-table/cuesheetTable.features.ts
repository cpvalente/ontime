import {
  columnOrderingFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  metaHelper,
  tableFeatures,
} from '@tanstack/react-table';
import type { CellContext, Column, ColumnDef, Header, HeaderGroup, Table } from '@tanstack/react-table';
import type { TimeField } from 'ontime-types';

import type { ExtendedEntry } from '../../../common/utils/rundownMetadata';
import type { AppMode } from '../../../ontimeConfig';

/**
 * Custom data we pass to the table
 * - `handleUpdate` callback to update the entry when the user edits a cell
 * - `handleUpdateTimer` callback to update the timer for a specific event
 * - `options-showDelayedTimes` whether to show or hide delayed times
 * - `options-hideTableSeconds` whether to hide seconds in the table
 * - `options-hideIndexColumn` whether to hide the index column
 * - `options-cuesheetMode` run or edit mode
 */
export interface CuesheetTableMeta {
  handleUpdate: (rowIndex: number, accessor: string, payload: string, isCustom: boolean) => void;
  handleUpdateTimer: (eventId: string, field: TimeField, payload: string) => void;
  options: {
    showDelayedTimes: boolean;
    hideTableSeconds: boolean;
    hideIndexColumn: boolean;
    cuesheetMode: AppMode;
  };
}

/**
 * Metadata specific for each column
 * - `canWrite` whether the user can write to this column
 * - `colour` background colour associated with a custom field
 */
export interface CuesheetColumnMeta {
  canWrite: boolean;
  colour?: string;
}

/**
 * Features registered in the cuesheet and rundown tables.
 * In v9 an API only exists once its feature is registered, so this list is the
 * source of truth for what the table can do:
 * - `columnOrderingFeature`: user reorders columns by dragging the headers
 * - `columnVisibilityFeature`: user toggles columns in the table settings
 * - `columnSizingFeature`: column widths, exposed to CSS as custom properties
 * - `columnResizingFeature`: the drag handle in the header (requires sizing)
 *
 * The `tableMeta` / `columnMeta` slots replace the v8 global module augmentation:
 * they scope our meta types to this table instead of every table in the app.
 */
export const cuesheetTableFeatures = tableFeatures({
  columnOrderingFeature,
  columnVisibilityFeature,
  columnSizingFeature,
  columnResizingFeature,
  tableMeta: metaHelper<CuesheetTableMeta>(),
  columnMeta: metaHelper<CuesheetColumnMeta>(),
});

export type CuesheetFeatures = typeof cuesheetTableFeatures;

/** Convenience aliases so consumers do not need to repeat the feature generic */
export type CuesheetColumnDef = ColumnDef<CuesheetFeatures, ExtendedEntry>;
export type CuesheetTable = Table<CuesheetFeatures, ExtendedEntry>;
export type CuesheetCellContext = CellContext<CuesheetFeatures, ExtendedEntry>;
export type CuesheetHeaderGroup = HeaderGroup<CuesheetFeatures, ExtendedEntry>;
export type CuesheetHeaderCell = Header<CuesheetFeatures, ExtendedEntry, unknown>;
export type CuesheetColumn = Column<CuesheetFeatures, ExtendedEntry, unknown>;
