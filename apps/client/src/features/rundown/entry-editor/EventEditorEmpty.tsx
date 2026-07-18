import { PropsWithChildren, memo } from 'react';

import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import Kbd from '../../../common/components/kbd/Kbd';
import { deviceAlt, deviceMod } from '../../../common/utils/deviceUtils';

import style from './EventEditorEmpty.module.scss';

export default memo(EventEditorEmpty);

function EventEditorEmpty() {
  return (
    <div className={style.entryEditor} data-testid='editor-container'>
      <div className={style.shortcutSection}>
        <Editor.Title className={style.prompt}>Rundown shortcuts</Editor.Title>
        <div className={style.shortcuts}>
          <ShortcutGroup title='Search'>
            <Shortcut label='Find in rundown'>
              <Combo keys={[deviceMod, 'F']} />
            </Shortcut>
            <Shortcut label='Open settings'>
              <Combo keys={[deviceMod, ',']} />
            </Shortcut>
          </ShortcutGroup>

          <ShortcutGroup title='Navigation'>
            <Shortcut label='Select entry'>
              <Combo keys={[deviceAlt, '↑']} />
              <Separator />
              <Combo keys={[deviceAlt, '↓']} />
            </Shortcut>
            <Shortcut label='Select group'>
              <Combo keys={[deviceAlt, 'Shift', '↑']} />
              <Separator />
              <Combo keys={[deviceAlt, 'Shift', '↓']} />
            </Shortcut>
            <Shortcut label='Jump to top / bottom'>
              <Combo keys={['Home']} />
              <Separator />
              <Combo keys={['End']} />
            </Shortcut>
            <Shortcut label='Page up / down'>
              <Combo keys={['PgUp']} />
              <Separator />
              <Combo keys={['PgDn']} />
            </Shortcut>
            <Shortcut label='Jump to current entry'>
              <Combo keys={[deviceAlt, 'L']} />
            </Shortcut>
            <Shortcut label='Deselect entry'>
              <Combo keys={['Esc']} />
            </Shortcut>
          </ShortcutGroup>

          <ShortcutGroup title='Editing'>
            <Shortcut label='Reorder selected entry'>
              <Combo keys={[deviceAlt, deviceMod, '↑']} />
              <Separator />
              <Combo keys={[deviceAlt, deviceMod, '↓']} />
            </Shortcut>
            <Shortcut label='Copy selected entry'>
              <Combo keys={[deviceMod, 'C']} />
            </Shortcut>
            <Shortcut label='Cut selected entry'>
              <Combo keys={[deviceMod, 'X']} />
            </Shortcut>
            <Shortcut label='Paste below'>
              <Combo keys={[deviceMod, 'V']} />
            </Shortcut>
            <Shortcut label='Paste above'>
              <Combo keys={[deviceMod, 'Shift', 'V']} />
            </Shortcut>
            <Shortcut label='Clone selected entry'>
              <Combo keys={[deviceMod, 'D']} />
            </Shortcut>
            <Shortcut label='Delete selected entry'>
              <Combo keys={[deviceAlt, 'Backspace']} />
            </Shortcut>
          </ShortcutGroup>

          <ShortcutGroup title='Insert'>
            <Shortcut label='Add event below / above'>
              <Combo keys={[deviceAlt, 'E']} />
              <Separator />
              <Combo keys={[deviceAlt, 'Shift', 'E']} />
            </Shortcut>
            <Shortcut label='Add group below / above'>
              <Combo keys={[deviceAlt, 'G']} />
              <Separator />
              <Combo keys={[deviceAlt, 'Shift', 'G']} />
            </Shortcut>
            <Shortcut label='Add milestone below / above'>
              <Combo keys={[deviceAlt, 'M']} />
              <Separator />
              <Combo keys={[deviceAlt, 'Shift', 'M']} />
            </Shortcut>
            <Shortcut label='Add delay below / above'>
              <Combo keys={[deviceAlt, 'D']} />
              <Separator />
              <Combo keys={[deviceAlt, 'Shift', 'D']} />
            </Shortcut>
          </ShortcutGroup>
        </div>
      </div>
    </div>
  );
}

function ShortcutGroup({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <section className={style.shortcutGroup}>
      <h3>{title}</h3>
      <div className={style.shortcutList}>{children}</div>
    </section>
  );
}

function Shortcut({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <div className={style.shortcutRow}>
      <span className={style.shortcutLabel}>{label}</span>
      <span className={style.shortcutKeys}>{children}</span>
    </div>
  );
}

function Combo({ keys }: { keys: string[] }) {
  return (
    <span className={style.keyCombo}>
      {keys.map((key) => (
        <Kbd key={key}>{key}</Kbd>
      ))}
    </span>
  );
}

function Separator() {
  return <span className={style.separator}>/</span>;
}
