import { PropsWithChildren } from 'react';

import { overrideStylesURL } from '../common/api/constants';
import { useRuntimeStylesheet } from '../common/hooks/useRuntimeStylesheet';
import useViewSettings from '../common/hooks-query/useViewSettings';

import Loader from './common/loader/Loader';

export default function ViewLoader({ children }: PropsWithChildren) {
  const { data } = useViewSettings();
  const { shouldRender } = useRuntimeStylesheet(data.overrideStyles ? overrideStylesURL : undefined);

  // eventually we would want to leverage suspense here
  // while the feature is not ready, we simply trigger a loader
  // suspense would have the advantage of being triggered also by react-query

  if (!shouldRender) {
    return <Loader />;
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment -- ensuring JSX return
  return <>{children}</>;
}
