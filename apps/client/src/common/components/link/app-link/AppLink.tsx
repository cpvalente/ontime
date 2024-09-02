import { type PropsWithChildren } from 'react';
import { useNavigate } from 'react-router-dom';

import { cx } from '../../../utils/styleUtils';

import style from './AppLink.module.scss';

interface AppLinkProps {
  className?: string;
  search: string;
}

/**
 * Component used to navigate to an editor link inside the same window
 * Handles the path to respect Ontime Clouds base URL
 */
export default function AppLink(props: PropsWithChildren<AppLinkProps>) {
  const { className, search, children } = props;
  const navigate = useNavigate();

  const handleClick = () => navigate({ search });

  return (
    <button onClick={handleClick} className={cx([style.link, className])}>
      {children}
    </button>
  );
}
