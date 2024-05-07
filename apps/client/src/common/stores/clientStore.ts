import { Clients } from 'ontime-types';
import { create } from 'zustand';

interface ClientStore {
  name?: string;
  setName: (newValue: string) => void;

  id: string;
  setId: (newValue: string) => void;

  redirect: string;
  setRedirect: (newValue: string) => void;

  clients: Clients;
  setClients: (clients: Clients) => void;
}

const clientNameKey = 'ontime-client-name';

function persistNameInStorage(newValue: string) {
  localStorage.setItem(clientNameKey, newValue);
}

export const useClientStore = create<ClientStore>((set) => ({
  name: localStorage.getItem(clientNameKey) ?? undefined,
  setName: (name: string) =>
    set(() => {
      persistNameInStorage(name);
      return { name };
    }),

  id: '',
  setId: (id) => set({ id }),

  redirect: '',
  setRedirect: (redirect: string) => set({ redirect }),

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
  useClientStore.getState().setName(name);
}

/**
 * Allows updating current client name (outside react)
 */
export function setCurrentClientId(id: string): void {
  useClientStore.getState().setId(id);
}

/**
 * Allows getting client name (outside react)
 */
export function getClientId(): string | undefined {
  return useClientStore.getState().id;
}

/**
 * Allows updating redirect (outside react)
 */
export function setClientRedirect(path: string): void {
  useClientStore.getState().setRedirect(path);
}

/**
 * Allows setting clients (outside react)
 */
export function setClients(clients: Clients): void {
  return useClientStore.getState().setClients(clients);
}
