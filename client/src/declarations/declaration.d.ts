declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

declare global {
  interface Window {
    ipcRenderer: {
      send: (channel: string, args?: string | object) => void;
    };
    process: {
      type: string;
    }
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {}