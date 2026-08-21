declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.css' {
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
    // Experimental browser feature
    documentPictureInPicture: {
      requestWindow: () => Promise<Window>;
      window: Window;
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
