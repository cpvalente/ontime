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
 * We pass a custom property to the table meta to allow field update
 */
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    handleUpdate: (rowIndex: number, accessor: string, payload: string, isCustom: boolean) => void;
    handleUpdateTimer: (eventId: string, field: TimeField, payload: string) => void;
    options: {
      showDelayedTimes: boolean;
      hideTableSeconds: boolean;
      timeFormat: TimeFormat;
    };
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
