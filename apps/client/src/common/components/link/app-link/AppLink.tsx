import { type PropsWithChildren } from 'react';
import { useSearchParams } from 'react-router';

import style from './AppLink.module.scss';

interface AppLinkProps {
  search: string;
}

/**
 * Component used to navigate to an editor link inside the same window
 * Handles the path to respect Ontime Clouds base URL
 * Keeps the current params it does not name, eg: the editor layout
 */
export default function AppLink({ search, children }: PropsWithChildren<AppLinkProps>) {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleClick = () => {
    const nextParams = new URLSearchParams(searchParams);
    new URLSearchParams(search).forEach((value, key) => nextParams.set(key, value));
    setSearchParams(nextParams);
  };

  return (
    <button onClick={handleClick} className={style.link}>
      {children}
    </button>
  );
}
