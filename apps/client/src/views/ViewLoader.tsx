import { PropsWithChildren } from 'react';

import { apiEntryUrl } from '../common/api/constants';
import { useRuntimeStylesheet } from '../common/hooks/useRuntimeStylesheet';

import Loader from './common/loader/Loader';

export default function ViewLoader({ children }: PropsWithChildren) {
  const { shouldRender } = useRuntimeStylesheet();

  // eventually we would want to leverage suspense here
  // while the feature is not ready, we simply trigger a loader
  // suspense would have the advantage of being triggered also by react-query

  if (!shouldRender) {
    return <Loader />;
  }

  return (
    <>
      <link rel='stylesheet' href={`${apiEntryUrl}/assets/css`} precedence='override' />
      {children}
    </>
  );
}
