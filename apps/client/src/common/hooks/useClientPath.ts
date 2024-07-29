import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useClientStore } from '../stores/clientStore';
import { socketSendJson } from '../utils/socket';

export const useClientPath = () => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const redirect = useClientStore((store) => store.redirect);
  const setRedirect = useClientStore((store) => store.setRedirect);

  // notify of client path changes
  useEffect(() => {
    socketSendJson('set-client-path', pathname + search);
  }, [pathname, search]);

  // navigate to new path when received from server
  useEffect(() => {
    if (redirect === '') {
      return;
    }

    // clear redirect
    setRedirect('');

    // navigate if there is a path change
    if (redirect !== pathname + search) {
      navigate(redirect);
    }
  }, [navigate, pathname, redirect, search, setRedirect]);
};
