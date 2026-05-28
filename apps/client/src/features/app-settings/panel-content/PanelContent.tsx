import { PropsWithChildren } from 'react';
import { IoClose } from 'react-icons/io5';

import Button from '../../../common/components/buttons/Button';
import { getPanelLabel } from '../useAppSettingsMenu';

import style from './PanelContent.module.scss';

interface PanelContentProps {
  onClose: () => void;
  panel: string;
  location?: string;
}

export default function PanelContent({ onClose, panel, location, children }: PropsWithChildren<PanelContentProps>) {
  const { panelLabel, sectionLabel } = getPanelLabel(panel, location);

  return (
    <div className={style.contentWrapper}>
      <div className={style.stickyHeader}>
        <span className={style.breadcrumb}>
          {panelLabel}
          {sectionLabel ? <> › {sectionLabel}</> : null}
        </span>
        <Button size='large' onClick={onClose}>
          Close settings <IoClose />
        </Button>
      </div>
      <div className={style.content}>{children}</div>
    </div>
  );
}
