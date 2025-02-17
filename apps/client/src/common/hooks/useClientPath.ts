import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/shallow';

import { useClientStore } from '../stores/clientStore';
import { socketSendJson } from '../utils/socket';

import { useIsOnline } from './useSocket';

export const useClientPath = () => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { redirect, setRedirect } = useClientStore(
    useShallow((store) => ({
      redirect: store.redirect,
      setRedirect: store.setRedirect,
    })),
  );
  const isOnline = useIsOnline();

  // notify of client path changes
  useEffect(() => {
    if (!isOnline) return;

    socketSendJson('set-client-path', pathname + search);
  }, [pathname, search, isOnline]);

  // navigate to new path when received from server
  useEffect(() => {
    if (redirect === '') {
      return;
    }

    // clear redirect
    setRedirect('');

    // navigate if there is a path change
    if (redirect !== pathname + search) {
      navigate(redirect, { replace: true });
    }
  }, [navigate, pathname, redirect, search, setRedirect]);
};
