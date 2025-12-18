import { PropsWithChildren } from 'react';

import { overrideStylesURL } from '../common/api/constants';
import { useRuntimeStylesheet } from '../common/hooks/useRuntimeStylesheet';
import { useIsOnline } from '../common/hooks/useSocket';
import useViewSettings from '../common/hooks-query/useViewSettings';
import { cx } from '../common/utils/styleUtils';

import Loader from './common/loader/Loader';

import style from './ViewLoader.module.scss';

export default function ViewLoader({ children }: PropsWithChildren) {
  const { data } = useViewSettings();
  const { shouldRender } = useRuntimeStylesheet(data.overrideStyles ? overrideStylesURL : undefined);
  const { isOnline } = useIsOnline();

  // eventually we would want to leverage suspense here
  // while the feature is not ready, we simply trigger a loader
  // suspense would have the advantage of being triggered also by react-query

  if (!shouldRender) {
    return <Loader />;
  }

  return <div className={cx([style.viewLoader, !isOnline && style.isOffline])}>{children}</div>;
}
