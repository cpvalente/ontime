import { AppMode } from '../ontimeConfig';

declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

type ListenerType = (event: 'string', args: unknown[]) => void;

declare global {
  /**
   * Register the electron properties
   */
  interface Window {
    ipcRenderer: {
      send: (channel: string, args?: string | object) => void;
      on: (channel: string, listener: ListenerType) => void;
    };
    process: {
      type: string;
    };
  }
}

/**
 * Declare custom data we pass to the table
 * - `handleUpdate` callback to update the entry when the user edits a cell
 * - `handleUpdateTimer` callback to update the timer for a specific event
 * - `options-showDelayedTimes` whether to show or hide delayed times
 * - `options-hideTableSeconds` whether to hide seconds in the table
 * - `options-hideIndexColumn` whether to hide the index column
 * - `options-cuesheetMode` run or edit mode
 *
 * And metadata specific for each column
 * - `canWrite` whether the user can write to this column
 * - `colour` background colour associated with a custom field
 */
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    handleUpdate: (rowIndex: number, accessor: string, payload: string, isCustom: boolean) => void;
    handleUpdateTimer: (eventId: string, field: TimeField, payload: string) => void;
    options: {
      showDelayedTimes: boolean;
      hideTableSeconds: boolean;
      hideIndexColumn: boolean;
      cuesheetMode: AppMode;
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    canWrite: boolean;
    colour?: string;
  }
}

/**
 * Allow passing CSS Properties
 */
declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}

export default {};
