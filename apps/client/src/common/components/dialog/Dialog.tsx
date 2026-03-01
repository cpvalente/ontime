import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { ReactNode } from 'react';
import { IoClose } from 'react-icons/io5';

import IconButton from '../buttons/IconButton';

import style from './Dialog.module.scss';

interface DialogProps {
  isOpen: boolean;
  title: string;
  showCloseButton?: boolean;
  showBackdrop?: boolean;
  bodyElements: ReactNode;
  footerElements?: ReactNode;
  onClose: () => void;
}

export default function Dialog({
  isOpen,
  title,
  showCloseButton,
  showBackdrop,
  bodyElements,
  footerElements,
  onClose,
}: DialogProps) {
  return (
    <BaseDialog.Root
      open={isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <BaseDialog.Portal>
        {showBackdrop && <BaseDialog.Backdrop className={style.backdrop} />}
        <BaseDialog.Popup className={style.dialog}>
          <div className={style.title}>
            {title}
            {showCloseButton && (
              <IconButton variant='subtle-white' onClick={onClose}>
                <IoClose />
              </IconButton>
            )}
          </div>
          <div className={style.body}>{bodyElements}</div>
          <div className={style.footer}>{footerElements}</div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
