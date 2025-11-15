import { lazy, memo, Suspense } from 'react';

import { isPipSupported } from './pip.utils';

const PipTimerHost = lazy(() => import('./PipHost'));

export default memo(PipRoot);
function PipRoot() {
  if (!isPipSupported) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <PipTimerHost />
    </Suspense>
  );
}
