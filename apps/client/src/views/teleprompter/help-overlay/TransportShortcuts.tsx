import { Combo, Separator, Shortcut, ShortcutGroup } from '../../../common/components/kbd/KeyboardShortcuts';
import { modeLabels } from '../teleprompter.options';

export default function TransportShortcuts() {
  return (
    <>
      <ShortcutGroup title='Transport'>
        <Shortcut label='Play / pause'>
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
        <Shortcut label={`${modeLabels.event} / ${modeLabels.script}`}>
          <Combo keys={['M']} />
        </Shortcut>
      </ShortcutGroup>

      <ShortcutGroup title='Navigation'>
        <Shortcut label='Scroll a line'>
          <Combo keys={['↑']} />
          <Separator />
          <Combo keys={['↓']} />
        </Shortcut>
        <Shortcut label='Scroll a screen'>
          <Combo keys={['PgUp']} />
          <Separator />
          <Combo keys={['PgDn']} />
        </Shortcut>
        <Shortcut label='Previous / next event'>
          <Combo keys={['Shift', '↑']} />
          <Separator />
          <Combo keys={['Shift', '↓']} />
        </Shortcut>
        <Shortcut label='Top of the script'>
          <Combo keys={['Home']} />
        </Shortcut>
        <Shortcut label='Back to the loaded event'>
          <Combo keys={['L']} />
        </Shortcut>
        <Shortcut label='Scroll'>
          <Combo keys={['Mouse wheel']} />
        </Shortcut>
      </ShortcutGroup>
    </>
  );
}
