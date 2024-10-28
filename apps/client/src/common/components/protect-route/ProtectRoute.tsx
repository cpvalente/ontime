import { PropsWithChildren, useCallback, useContext } from 'react';

import { isLocalhost } from '../../api/constants';
import { AppContext } from '../../context/AppContext';

import PinPage from './PinPage';

interface ProtectRouteProps {
  permission: 'editor' | 'operator';
}

export default function ProtectRoute({ permission, children }: PropsWithChildren<ProtectRouteProps>) {
  const { editorAuth, operatorAuth, validate } = useContext(AppContext);

  const handleValidation = useCallback(
    (pin: string) => {
      return validate(pin, permission);
    },
    [permission, validate],
  );

  const hasRelevantAuth = () => {
    if (permission === 'editor') {
      return editorAuth;
    }
    if (permission === 'operator') {
      return operatorAuth;
    }
    return false;
  };

  if (isLocalhost || hasRelevantAuth()) {
    // eslint-disable-next-line react/jsx-no-useless-fragment -- trying to make typescript happy
    return <>{children}</>;
  }

  return <PinPage permission={permission} handleValidation={handleValidation} />;
}
