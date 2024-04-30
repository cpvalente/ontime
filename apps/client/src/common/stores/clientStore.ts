import { create } from 'zustand';

interface ClientStore {
  self?: string;
  setName: (newValue: string) => void;

  identify: Record<string, boolean>;
  setIdent: (clientName: string, value: boolean) => void;
}

const clientNameKey = 'ontime-client-name';

function persistNameInStorage(newValue: string) {
  localStorage.setItem(clientNameKey, newValue);
}

export const useClientStore = create<ClientStore>((set) => ({
  self: localStorage.getItem(clientNameKey) ?? undefined,
  setName: (newValue: string) =>
    set(() => {
      persistNameInStorage(newValue);
      return { self: newValue };
    }),

  identify: {},
  setIdent: (clientName, value) => set((state) => (state.identify = { ...state.identify, [clientName]: value })),
}));

/**
 * Allows getting client name (outside react)
 */
export function getPreferredClientName(): string | undefined {
  return useClientStore.getState().self;
}

/**
 * Allows updating current client name (outside react)
 */
export function setCurrentClientName(self: string): void {
  const setName = useClientStore.getState().setName;
  setName(self);
}

/**
 * Allows setting identify (outside react)
 */
export function setIdentify(clientName: string, value: boolean): void {
  return useClientStore.getState().setIdent(clientName, value);
}