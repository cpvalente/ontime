declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

type ListenerType = (event: 'string', args: unknown[]) => void;

declare global {
  interface Window {
    ipcRenderer: {
      send: (channel: string, args?: string | object) => void;
      on: (channel: string, listener: ListenerType) => void;
    };
    process: {
      type: string;
    }
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {}