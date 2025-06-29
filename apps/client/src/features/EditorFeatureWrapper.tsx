import { PropsWithChildren } from 'react';

import ProtectRoute from '../common/components/protect-route/ProtectRoute';

import style from './EditorFeatureWrapper.module.scss';

export default function EditorFeatureWrapper({ children }: PropsWithChildren) {
  return (
    <ProtectRoute permission='editor'>
      <div className={style.wrapper}>{children}</div>
    </ProtectRoute>
  );
}
