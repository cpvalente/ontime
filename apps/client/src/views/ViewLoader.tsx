import { PropsWithChildren, Suspense } from 'react';

import useCssOverride from '../common/hooks-query/useCssOverride';
import useViewSettings from '../common/hooks-query/useViewSettings';
import Loader from './common/loader/Loader';

const scriptTagId = 'ontime-stylesheet-override';

function OverrideStyles() {
  'use memo';
  const { data: settings } = useViewSettings();
  const { overrideStyles } = settings;
  const { data: css } = useCssOverride(overrideStyles);
  const cssBlob = URL.createObjectURL(new Blob([css], { type: 'text/css' }));

  //@ts-expect-error disabled exists on link when rel='stylesheet' https://react.dev/reference/react-dom/components/link#props
  return <link id={scriptTagId} rel='stylesheet' href={cssBlob} precedence='high' disabled={!overrideStyles} />;
}

export default function ViewLoader({ children }: PropsWithChildren) {
  'use memo';
  // we need to be able to override the background colour with the key param
  const searchParams = new URLSearchParams(window.location.search);
  const colourFromParams = searchParams.get('keyColour') ?? '#101010';

  // always keep body background in sync so Safari iOS overscroll area matches the view
  const bodyBgStyle = `body { background-color: var(--background-color-override, ${colourFromParams}); }`;

  return (
    <Suspense
      fallback={
        <>
          <style>{bodyBgStyle}</style>
          <Loader />
        </>
      }
    >
      <style>{bodyBgStyle}</style>
      <OverrideStyles />
      {children}
    </Suspense>
  );
}
