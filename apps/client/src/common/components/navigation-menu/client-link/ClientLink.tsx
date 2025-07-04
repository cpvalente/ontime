import { PropsWithChildren } from 'react';
import { IoArrowUp } from 'react-icons/io5';
import { useNavigate } from 'react-router';

import { useElectronEvent } from '../../../hooks/useElectronEvent';
import { handleLinks } from '../../../utils/linkUtils';
import NavigationMenuItem from '../navigation-menu-item/NavigationMenuItem';

import style from './ClientLink.module.scss';

interface ClientLinkProps {
  current: boolean;
  to: string;
}

export default function ClientLink({ current, to, children }: PropsWithChildren<ClientLinkProps>) {
  const { isElectron } = useElectronEvent();
  const navigate = useNavigate();

  if (isElectron) {
    return (
      <NavigationMenuItem active={current} onClick={() => handleLinks(to)}>
        {children}
        <IoArrowUp className={style.linkIcon} />
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem active={current} onClick={() => navigate(`/${to}`)}>
      {children}
    </NavigationMenuItem>
  );
}
