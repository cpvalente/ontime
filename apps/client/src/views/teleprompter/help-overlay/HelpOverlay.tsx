import { Dialog } from '@base-ui/react/dialog';
import { IoClose } from 'react-icons/io5';

import IconButton from '../../../common/components/buttons/IconButton';
import {
  Combo,
  Separator,
  Shortcut,
  ShortcutGroup,
  ShortcutGroups,
} from '../../../common/components/keyboard-shortcuts/KeyboardShortcuts';

interface HelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpOverlay({ isOpen, onClose }: HelpOverlayProps) {
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
        <Dialog.Popup className='teleprompter__help-card'>
          <div className='teleprompter__help-header'>
            <Dialog.Title className='teleprompter__help-title'>Prompter shortcuts</Dialog.Title>
            <IconButton variant='subtle-white' size='large' onClick={onClose} aria-label='Close'>
              <IoClose />
            </IconButton>
          </div>

          <ShortcutGroups className='teleprompter__help-groups'>
            <ShortcutGroup title='Transport'>
              <Shortcut label='Start / stop scrolling'>
                <Combo keys={['Space']} />
              </Shortcut>
              <Shortcut label='Slower / faster'>
                <Combo keys={['←']} />
                <Separator />
                <Combo keys={['→']} />
              </Shortcut>
              <Shortcut label='Larger speed steps'>
                <Combo keys={['Shift', '←']} />
                <Separator />
                <Combo keys={['Shift', '→']} />
              </Shortcut>
            </ShortcutGroup>

            <ShortcutGroup title='Navigation'>
              <Shortcut label='Nudge one line'>
                <Combo keys={['↑']} />
                <Separator />
                <Combo keys={['↓']} />
              </Shortcut>
              <Shortcut label='Jump a screen'>
                <Combo keys={['PgUp']} />
                <Separator />
                <Combo keys={['PgDn']} />
              </Shortcut>
              <Shortcut label='Jump to top / end'>
                <Combo keys={['Home']} />
                <Separator />
                <Combo keys={['End']} />
              </Shortcut>
              <Shortcut label='Rewind and stop'>
                <Combo keys={['Esc']} />
              </Shortcut>
              <Shortcut label='Follow the loaded event again'>
                <Combo keys={['L']} />
              </Shortcut>
            </ShortcutGroup>

            <ShortcutGroup title='Display'>
              <Shortcut label='Font size'>
                <Combo keys={['+']} />
                <Separator />
                <Combo keys={['-']} />
              </Shortcut>
              <Shortcut label='Reset font size'>
                <Combo keys={['0']} />
              </Shortcut>
              <Shortcut label='Flip horizontally / vertically'>
                <Combo keys={['F']} />
                <Separator />
                <Combo keys={['Shift', 'F']} />
              </Shortcut>
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
