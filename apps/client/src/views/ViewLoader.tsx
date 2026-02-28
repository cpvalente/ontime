import { PropsWithChildren } from 'react';

import { overrideStylesURL } from '../common/api/constants';
import useViewSettings from '../common/hooks-query/useViewSettings';
import { useRuntimeStylesheet } from '../common/hooks/useRuntimeStylesheet';
import Loader from './common/loader/Loader';

export default function ViewLoader({ children }: PropsWithChildren) {
  const { data } = useViewSettings();
  const { shouldRender } = useRuntimeStylesheet(data.overrideStyles ? overrideStylesURL : undefined);

  // we need to be able to override the background colour with the key param
  const searchParams = new URLSearchParams(window.location.search);
  const colourFromParams = searchParams.get('keyColour') ?? '#101010';

  // eventually we would want to leverage suspense here
  // while the feature is not ready, we simply trigger a loader
  // suspense would have the advantage of being triggered also by react-query

  if (!shouldRender) {
    return (
      <>
        <style>{`body { background: var(--background-color-override, ${colourFromParams}); }`}</style>
        <Loader />
      </>
    );
  }

  return (
    <>
      <style>{`body { background: var(--background-color-override, ${colourFromParams}); }`}</style>
      {children}
    </>
  );
}
