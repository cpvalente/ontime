import { useStore } from 'zustand';
import { create } from 'zustand';

export type ClientListStore = {
  clients: [];
};

export const clientListStorePlaceholder: ClientListStore = {
  clients: [],
};

export const clientListStore = create<ClientListStore>(() => ({
  ...clientListStorePlaceholder,
}));

export const useClientList = () => useStore(clientListStore);
