import { PropsWithChildren } from 'react';

import useOverrideStylesheet from '../common/hooks-query/useOverrideStylesheet';

import style from './ViewLoader.module.scss';

export default function ViewLoader({ children }: PropsWithChildren) {
  const { shouldRender } = useOverrideStylesheet();

  // eventually we would want to leverage suspense here
  // while the feature is not ready, we simply trigger a loader
  // suspense would have the advantage of being triggered also by react-query

  if (!shouldRender) {
    return (
      <div className={style.loader}>
        <div className={style.ellipsis}>
          <div />
          <div />
          <div />
          <div />
        </div>
      </div>
    );
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment -- ensuring JSX return
  return <>{children}</>;
}
