import { create } from 'zustand';

interface ClientListStore {
  self?: string;
  clients: string[];
  setClients: (clients: string[]) => void;
  setName: (newValue: string) => void;
}

const clientNameKey = 'ontime-client-name';

function persistNameInStorage(newValue: string) {
  localStorage.setItem(clientNameKey, newValue);
}

export const useClientList = create<ClientListStore>((set) => ({
  self: localStorage.getItem(clientNameKey) ?? undefined,
  clients: [],
  setClients: (clients: string[]) => set({ clients }),
  setName: (newValue: string) =>
    set(() => {
      persistNameInStorage(newValue);
      return { self: newValue };
    }),
}));

/**
 * Allows updating list of current client (outside react)
 */
export function getPreferredClientName(): string | undefined {
  return useClientList.getState().self;
}

/**
 * Allows updating entire list of clients (outside react)
 */
export function setClientList(clients: string[]): void {
  useClientList.setState({ clients });
}

/**
 * Allows updating list of current client (outside react)
 */
export function setCurrentClientName(self: string): void {
  const setName = useClientList.getState().setName;
  setName(self);
}
