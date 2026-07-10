import { PropsWithChildren } from 'react';
import { IoArrowUp } from 'react-icons/io5';
import { useLocation, useNavigate } from 'react-router';

import { useElectronEvent } from '../../../hooks/useElectronEvent';
import { stripReservedParams, useSavedViewParams } from '../../../stores/savedViewParams';
import { handleLinks } from '../../../utils/linkUtils';
import NavigationMenuItem from '../navigation-menu-item/NavigationMenuItem';

import style from './ClientLink.module.scss';

interface ClientLinkProps {
  current: boolean;
  to: string;
  postAction?: () => void;
}

export default function ClientLink({ current, to, postAction, children }: PropsWithChildren<ClientLinkProps>) {
  const { isElectron } = useElectronEvent();
  const navigate = useNavigate();
  const location = useLocation();
  const { params: savedParams, save } = useSavedViewParams();

  /**
   * Save the params of the view we are leaving and resolve the destination,
   * restoring any params previously saved for the target view.
   */
  const resolveDestination = () => {
    const currentView = location.pathname.replace(/^\//, '');
    save(currentView, stripReservedParams(location.search));
    const restored = savedParams[to];
    return `${to}${restored ? `?${restored}` : ''}`;
  };

  if (isElectron) {
    return (
      <NavigationMenuItem
        active={current}
        onClick={() => {
          handleLinks(resolveDestination());
          postAction?.();
        }}
      >
        {children}
        <IoArrowUp className={style.linkIcon} />
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem
      active={current}
      onClick={() => {
        navigate(`/${resolveDestination()}`);
        postAction?.();
      }}
    >
      {children}
    </NavigationMenuItem>
  );
}
