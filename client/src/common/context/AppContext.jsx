import React, { createContext, useCallback, useEffect, useState } from 'react';

import { APP_SETTINGS } from '../api/apiConstants';
import { getSettings } from '../api/ontimeApi';
import { useFetch } from '../hooks/useFetch';

export const AppContext = createContext({
  auth: false,
  data: {
    pinCode: null,
  },
});

export const AppContextProvider = ({ children }) => {
  const [auth, setAuth] = useState(true);
  const { data } = useFetch(APP_SETTINGS, getSettings);

  useEffect(() => {
    if (data == null) return;
    const previousEntry = sessionStorage.getItem('ontime-entry');
    if (previousEntry) {
      if (previousEntry === data?.pinCode) {
        setAuth(true);
      } else {
        sessionStorage.removeItem('ontime-entry')
      }
    } else if (data?.pinCode == null || data?.pinCode === '') {
      setAuth(true);
    } else {
      setAuth(false);
    }
  }, [data]);

  /**
   * Validates a pincode
   * @return boolean - whether the pin is valid
   */
  const validate = useCallback(
    (pin) => {
      let correct;
      if (data?.pinCode == null || data?.pinCode === '') {
        correct = true;
      } else {
        correct = pin === data?.pinCode;
      }
      if (correct) {
        sessionStorage.setItem('ontime-entry', pin);
      }
      setAuth(correct);
      return correct;
    },
    [data]
  );

  return <AppContext.Provider value={{ auth, validate }}>{children}</AppContext.Provider>;
};
