import { MouseEvent, PropsWithChildren } from 'react';
import { IoArrowUp, IoCloseOutline } from 'react-icons/io5';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

import { useElectronEvent } from '../../../hooks/useElectronEvent';
import { hasCustomParams, RESERVED_PARAMS, stripReservedParams, useSavedViewParams } from '../../../stores/savedViewParams';
import { handleLinks } from '../../../utils/linkUtils';
import IconButton from '../../buttons/IconButton';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { params: savedParams, save, clear } = useSavedViewParams();

  // the customisation of the view we are currently on lives in the URL until we
  // navigate away; every other view reflects whatever was saved when we last left it
  const isCustomised = current ? hasCustomParams(searchParams) : Boolean(savedParams[to]);

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

  /**
   * Clear the saved settings for this route without navigating to it.
   * When it is the current view, also reset the live URL to its defaults.
   */
  const clearViewSettings = (event: MouseEvent) => {
    event.stopPropagation();
    clear(to);
    if (current) {
      const preserved = new URLSearchParams();
      RESERVED_PARAMS.forEach((key) => {
        const value = searchParams.get(key);
        if (value !== null) preserved.set(key, value);
      });
      setSearchParams(preserved);
    }
  };

  const trailing = (isCustomised || isElectron) && (
    <span className={style.trailing}>
      {isCustomised && (
        <>
          <span className={style.indicator} aria-hidden data-testid='client-link__saved-indicator' />
          <IconButton
            variant='ghosted-white'
            size='small'
            className={style.clear}
            aria-label='Clear saved view settings'
            title='Clear saved view settings'
            data-testid='client-link__clear'
            onClick={clearViewSettings}
          >
            <IoCloseOutline />
          </IconButton>
        </>
      )}
      {isElectron && <IoArrowUp className={style.linkIcon} />}
    </span>
  );

  const handleClick = () => {
    if (isElectron) {
      handleLinks(resolveDestination());
    } else {
      navigate(`/${resolveDestination()}`);
    }
    postAction?.();
  };

  return (
    <NavigationMenuItem active={current} onClick={handleClick}>
      {children}
      {trailing}
    </NavigationMenuItem>
  );
}
