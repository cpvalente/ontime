import { create } from 'zustand';

/**
 * What the client should tell the user about its connection.
 * The runtime ping remains the source of truth for data staleness.
 */
export enum ConnectionStatus {
  /** connected, or interrupted too briefly to be worth reporting */
  Connected = 'connected',
  Reconnecting = 'reconnecting',
  /** the retries are not paying off and the data on screen is stale */
  Disconnected = 'disconnected',
}

interface ConnectionStore {
  status: ConnectionStatus;
  recoveredAt: number | null;
}

export const useConnectionStore = create<ConnectionStore>(() => ({
  status: ConnectionStatus.Connected,
  recoveredAt: null,
}));

export function setConnectionEstablished(): void {
  useConnectionStore.setState((state) => ({
    status: ConnectionStatus.Connected,
    // we only confirm a recovery from an interruption the user was told about
    recoveredAt: state.status === ConnectionStatus.Connected ? null : Date.now(),
  }));
}

export function setConnectionLost(): void {
  useConnectionStore.setState((state) => ({
    // a connection we have given up on does not become promising again by retrying
    status: state.status === ConnectionStatus.Disconnected ? state.status : ConnectionStatus.Reconnecting,
    recoveredAt: null,
  }));
}

export function setConnectionStale(): void {
  useConnectionStore.setState({ status: ConnectionStatus.Disconnected });
}
