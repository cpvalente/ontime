import { createContext, PropsWithChildren, useCallback, useEffect, useState } from 'react';

import { baseURI } from '../../externals';
import useSettings from '../hooks-query/useSettings';

interface AppContextType {
  editorAuth: boolean;
  operatorAuth: boolean;
  validate: (pin: string, permission: 'editor' | 'operator') => boolean;
}

export const AppContext = createContext<AppContextType>({
  editorAuth: false,
  operatorAuth: false,
  validate: () => false,
});

const storageKeys = {
  editor: 'ontime-editor-entry',
  operator: 'ontime-operator-entry',
};

export const AppContextProvider = ({ children }: PropsWithChildren) => {
  const { status, data } = useSettings();
  const [editorAuth, setEditorAuth] = useState(true);
  const [operatorAuth, setOperatorAuth] = useState(true);

  useEffect(() => {
    if (status === 'pending') return;
    const previousEditor = sessionStorage.getItem(`${baseURI}${storageKeys.editor}`);

    if (previousEditor && previousEditor === data.editorKey) {
      setEditorAuth(true);
    } else {
      setEditorAuth(data.editorKey == null || data.editorKey === '');
    }

    const previousOperator = sessionStorage.getItem(`${baseURI}${storageKeys.operator}`);
    if (previousOperator && previousOperator === data.operatorKey) {
      setOperatorAuth(true);
    } else {
      setOperatorAuth(data.operatorKey == null || data.operatorKey === '');
    }
  }, [data, status]);

  /**
   * Validates a pincode
   * @return boolean - whether the pin is valid
   */
  const validate = useCallback(
    (pin: string, permission: 'editor' | 'operator'): boolean => {
      function isValid(pin: string, savedPin?: string | null): boolean {
        return savedPin == null || savedPin === '' || pin === savedPin;
      }

      if (permission === 'editor') {
        const correct = isValid(pin, data.editorKey);
        if (correct) {
          sessionStorage.setItem(`${baseURI}${storageKeys.editor}`, pin);
        }
        setEditorAuth(correct);
        return correct;
      } else if (permission === 'operator') {
        const correct = isValid(pin, data.operatorKey);
        if (correct) {
          sessionStorage.setItem(`${baseURI}${storageKeys.operator}`, pin);
        }
        setOperatorAuth(correct);
        return correct;
      }
      return false;
    },
    [data],
  );

  return <AppContext.Provider value={{ editorAuth, operatorAuth, validate }}>{children}</AppContext.Provider>;
};
