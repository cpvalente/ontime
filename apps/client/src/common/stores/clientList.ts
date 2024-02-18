import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

type ClientListStore = {
  clients: [];
};

export const clientListStore = createStore<ClientListStore>(() => ({
  clients: [],
}));

export const useClientList = () => useStore(clientListStore);
