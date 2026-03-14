export interface IAdapter {
  shutdown: () => Promise<void>;
}
