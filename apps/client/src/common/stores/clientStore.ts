import { Clients } from 'ontime-types';
import { create } from 'zustand';

interface ClientStore {
  myName?: string;
  setMyName: (newValue: string) => void;

  clients: Clients;
  setClients: (clients: Clients) => void;
}

const clientNameKey = 'ontime-client-name';

function persistNameInStorage(newValue: string) {
  localStorage.setItem(clientNameKey, newValue);
}

export const useClientStore = create<ClientStore>((set) => ({
  myName: localStorage.getItem(clientNameKey) ?? undefined,
  setMyName: (newValue: string) =>
    set(() => {
      persistNameInStorage(newValue);
      return { myName: newValue };
    }),

  clients: {},
  setClients: (clients: Clients) => set({ clients }),
}));

/**
 * Allows getting client name (outside react)
 */
export function getPreferredClientName(): string | undefined {
  return useClientStore.getState().myName;
}

/**
 * Allows updating current client name (outside react)
 */
export function setCurrentClientName(self: string): void {
  const setName = useClientStore.getState().setMyName;
  setName(self);
}

/**
 * Allows setting clients (outside react)
 */
export function setClients(clients: Clients): void {
  return useClientStore.getState().setClients(clients);
}
