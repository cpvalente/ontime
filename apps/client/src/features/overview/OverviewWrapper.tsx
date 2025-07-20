import { PropsWithChildren, ReactNode } from 'react';
import { ErrorBoundary } from '@sentry/react';

import { useIsOnline } from '../../common/hooks/useSocket';
import { cx } from '../../common/utils/styleUtils';

import style from './Overview.module.scss';

interface OverviewWrapperProps {
  navElements: ReactNode;
}

export function OverviewWrapper({ navElements, children }: PropsWithChildren<OverviewWrapperProps>) {
  const { isOnline } = useIsOnline();
  return (
    <div className={cx([style.overview, !isOnline && style.isOffline])}>
      <ErrorBoundary>
        <div className={style.nav}>{navElements}</div>
        <div className={style.info}>{children}</div>
      </ErrorBoundary>
    </div>
  );
}
