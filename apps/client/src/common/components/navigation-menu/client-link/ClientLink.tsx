import { MouseEvent, PropsWithChildren } from 'react';
import { IoArrowUp, IoCloseOutline } from 'react-icons/io5';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

import { useElectronEvent } from '../../../hooks/useElectronEvent';
import {
  hasCustomParams,
  reservedParams,
  stripReservedParams,
  useSavedViewParams,
} from '../../../stores/savedViewParams';
import { handleLinks } from '../../../utils/linkUtils';
import IconButton from '../../buttons/IconButton';
import Tooltip from '../../tooltip/Tooltip';
import NavigationMenuItem from '../navigation-menu-item/NavigationMenuItem';

import style from './ClientLink.module.scss';

interface ClientLinkProps {
  current: boolean;
  to: string;
  postAction?: () => void;
}

export default function ClientLink({ current, to, postAction, children }: PropsWithChildren<ClientLinkProps>) {
  const { isElectron } = useElectronEvent();

  if (isElectron) {
    return (
      <ElectronNavigationItem current={current} to={to} postAction={postAction}>
        {children}
      </ElectronNavigationItem>
    );
  }

  return (
    <BrowserNavigationItem current={current} to={to} postAction={postAction}>
      {children}
    </BrowserNavigationItem>
  );
}

function ElectronNavigationItem({ current, to, postAction, children }: PropsWithChildren<ClientLinkProps>) {
  const navigateToLink = () => {
    handleLinks(to);
    postAction?.();
  };

  return (
    <NavigationMenuItem active={current} onClick={navigateToLink}>
      {children}
      <span className={style.trailing}>
        <IoArrowUp className={style.linkIcon} />
      </span>
    </NavigationMenuItem>
  );
}

function BrowserNavigationItem({ current, to, postAction, children }: PropsWithChildren<ClientLinkProps>) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { params: savedParams, save, clear } = useSavedViewParams();

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

  const isCustomised = current ? hasCustomParams(searchParams) : Boolean(savedParams[to]);

  const navigateToLink = () => {
    const destination = resolveDestination();
    navigate(`/${destination}`);
    postAction?.();
  };

  /**
   * Clear the saved settings for this route without navigating to it.
   * When it is the current view, also reset the live URL to its defaults.
   */
  const clearViewSettings = (event: MouseEvent) => {
    event.stopPropagation();
    clear(to);

    // if mounted, clear the URL params
    if (current) {
      const preserved = new URLSearchParams();
      reservedParams.forEach((key) => {
        const value = searchParams.get(key);
        if (value !== null) preserved.set(key, value);
      });
      setSearchParams(preserved);
    }
  };

  return (
    <NavigationMenuItem active={current} onClick={navigateToLink}>
      {children}
      {isCustomised && (
        <span className={style.trailing}>
          <span className={style.indicator} aria-hidden data-testid='client-link__saved-indicator' />
          <Tooltip
            text='Reset to default'
            render={
              <IconButton
                variant='ghosted-white'
                size='small'
                className={style.clear}
                aria-label='Reset to default'
                onClick={clearViewSettings}
              />
            }
          >
            <IoCloseOutline />
          </Tooltip>
        </span>
      )}
    </NavigationMenuItem>
  );
}
