import { ReactNode } from 'react';

import ProtectRoute from '../common/components/protect-route/ProtectRoute';

import style from './FeatureWrapper.module.scss';

interface FeatureWrapperProps {
  children: ReactNode;
}

export default function FeatureWrapper({ children }: FeatureWrapperProps) {
  return (
    <ProtectRoute>
      <div className={style.wrapper}>{children}</div>
    </ProtectRoute>
  );
}
