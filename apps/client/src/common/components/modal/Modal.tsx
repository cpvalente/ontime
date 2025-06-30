import type { ReactNode } from 'react';
import { IoClose } from 'react-icons/io5';
import { Dialog as BaseDialog } from '@base-ui-components/react/dialog';

import IconButton from '../buttons/IconButton';

import style from './Modal.module.scss';

interface ModalProps {
  isOpen: boolean;
  title: string;
  showCloseButton?: boolean;
  showBackdrop?: boolean;
  bodyElements: ReactNode;
  footerElements?: ReactNode;
  onClose: () => void;
}

export default function Modal({
  isOpen,
  title,
  showCloseButton,
  showBackdrop,
  bodyElements,
  footerElements,
  onClose,
}: ModalProps) {
  return (
    <BaseDialog.Root
      open={isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      dismissible={false}
    >
      <BaseDialog.Portal>
        {showBackdrop && <BaseDialog.Backdrop className={style.backdrop} />}
        <BaseDialog.Popup className={style.modal}>
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
