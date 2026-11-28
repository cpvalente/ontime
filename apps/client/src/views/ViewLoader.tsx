import { PropsWithChildren, Suspense, use } from 'react';
import { useSearchParams } from 'react-router';

import { makeViewParamsReader } from '../common/components/view-params-editor/viewParams.utils';
import { PresetContext } from '../common/context/PresetContext';
import useCssOverride from '../common/hooks-query/useCssOverride';
import useViewSettings from '../common/hooks-query/useViewSettings';
import Loader from './common/loader/Loader';
import { makeColourString } from './common/viewUtils';

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
  const [searchParams] = useSearchParams();
  const maybePreset = use(PresetContext);
  const presetParams = maybePreset ? new URLSearchParams(maybePreset.search) : undefined;
  const colourFromParams =
    makeColourString(makeViewParamsReader(searchParams, presetParams).get('keyColour')) ?? '#101010';

  return (
    <>
      <style>{`body { background: var(--background-color-override, ${colourFromParams}); }`}</style>
      <Suspense
        fallback={
          <>
            <Loader />
          </>
        }
      >
        <OverrideStyles />
        {children}
      </Suspense>
    </>
  );
}
