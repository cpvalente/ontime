import { Dialog } from '@base-ui/react/dialog';
import type { PropsWithChildren } from 'react';
import { IoClose } from 'react-icons/io5';

import IconButton from '../../../common/components/buttons/IconButton';
import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import { Combo, Shortcut, ShortcutGroup, ShortcutGroups } from '../../../common/components/kbd/KeyboardShortcuts';

interface HelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  note?: string;
}

export default function HelpOverlay({ isOpen, onClose, note, children }: PropsWithChildren<HelpOverlayProps>) {
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className='teleprompter__help' />
        <Dialog.Popup className='teleprompter__help-card' data-testid='teleprompter-help'>
          <div className='teleprompter__help-header'>
            <Dialog.Title render={<Editor.Title className='teleprompter__help-title' />}>
              Prompter shortcuts
            </Dialog.Title>
            <IconButton variant='subtle-white' size='large' onClick={onClose} aria-label='Close'>
              <IoClose />
            </IconButton>
          </div>

          {note && <p className='teleprompter__help-note'>{note}</p>}
          <ShortcutGroups>
            {children}
            <ShortcutGroup title='Help'>
              <Shortcut label='Show this list'>
                <Combo keys={['?']} />
              </Shortcut>
            </ShortcutGroup>
          </ShortcutGroups>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
