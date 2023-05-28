import { createContext, PropsWithChildren, useCallback, useContext, useState } from 'react';

import ModalLoader from '../../features/modals/modal-loader/ModalLoader';

interface ModalContextState {
  showLoader: boolean;
  setShowLoader: (newValue: boolean) => void;
}

const ModalContext = createContext<ModalContextState | undefined>(undefined);

export function ModalContextProvider({ children }: PropsWithChildren) {
  const [showLoader, _setShowLoader] = useState(false);

  const setShowLoader = useCallback((newValue: boolean) => _setShowLoader(newValue), [_setShowLoader]);

  return (
    <ModalContext.Provider value={{ showLoader, setShowLoader }}>
      <ModalLoader />
      {children}
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextState {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalContextProvider');
  }
  return context;
}
