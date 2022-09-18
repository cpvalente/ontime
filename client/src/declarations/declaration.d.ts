declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

declare namespace NodeJS {
  interface Process {
    type: string;
  }
}

declare global {
  interface Window {
    ipcRenderer: {
      send: (channel: string, args: any) => void;
    };
  }
}
