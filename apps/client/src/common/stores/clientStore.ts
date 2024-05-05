import { Clients } from 'ontime-types';
import { create } from 'zustand';

interface ClientStore {
  name?: string;
  setMyName: (newValue: string) => void;

  id: string;
  setId: (newValue: string) => void;

  clients: Clients;
  setClients: (clients: Clients) => void;
}

const clientNameKey = 'ontime-client-name';

function persistNameInStorage(newValue: string) {
  localStorage.setItem(clientNameKey, newValue);
}

export const useClientStore = create<ClientStore>((set) => ({
  name: localStorage.getItem(clientNameKey) ?? undefined,
  setMyName: (newValue: string) =>
    set(() => {
      persistNameInStorage(newValue);
      return { name: newValue };
    }),

  id: '',
  setId: (id) => set({ id }),

  clients: {},
  setClients: (clients: Clients) => set({ clients }),
}));

/**
 * Allows getting client name (outside react)
 */
export function getPreferredClientName(): string | undefined {
  return useClientStore.getState().name;
}

/**
 * Allows updating current client name (outside react)
 */
export function setCurrentClientName(name: string): void {
  useClientStore.getState().setMyName(name);
}

/**
 * Allows updating current client name (outside react)
 */
export function setCurrentClientId(id: string): void {
  useClientStore.getState().setId(id);
}

/**
 * Allows setting clients (outside react)
 */
export function setClients(clients: Clients): void {
  return useClientStore.getState().setClients(clients);
}
