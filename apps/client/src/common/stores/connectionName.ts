import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

interface SocketClientNameState {
  name?: string;
  setName: (newValue: string) => void;
  persistName: (newValue: string) => void;
}

const clientNameKey = 'ontime-client-name';

function persistKeyToStorage(newValue: string) {
  localStorage.setItem(clientNameKey, newValue);
}

export const socketClientName = createStore<SocketClientNameState>((set) => ({
  name: localStorage.getItem(clientNameKey) ?? undefined,
  setName: (newValue: string) => set(() => ({ name: newValue })),
  persistName: (newValue: string) =>
    set(() => {
      persistKeyToStorage(newValue);
      return { name: newValue };
    }),
}));

export const useSocketClientName = () => useStore(socketClientName);
