import { type PropsWithChildren } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { mergeSearch } from '../../../utils/linkUtils';

import style from './AppLink.module.scss';

interface AppLinkProps {
  search: string;
}

/**
 * Component used to navigate to an editor link inside the same window
 * Handles the path to respect Ontime Clouds base URL
 * Keeps the current params, so the editor keeps its layout
 */
export default function AppLink({ search, children }: PropsWithChildren<AppLinkProps>) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => navigate({ search: mergeSearch(location.search, search) });

  return (
    <button onClick={handleClick} className={style.link}>
      {children}
    </button>
  );
}
