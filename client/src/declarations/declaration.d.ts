declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

declare namespace NodeJS {
  export interface ProcessEnv {
    type: string
  }
}
