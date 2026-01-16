import { memo, PropsWithChildren } from 'react';

import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import { deviceAlt, deviceMod } from '../../../common/utils/deviceUtils';

import style from './EventEditorEmpty.module.scss';

export default memo(EventEditorEmpty);

function EventEditorEmpty() {
  return (
    <div className={style.entryEditor} data-testid='editor-container'>
      <div className={style.shortcutSection}>
        <Editor.Title className={style.prompt}>Rundown shortcuts</Editor.Title>
        <table className={style.shortcuts}>
          <tbody>
            <tr>
              <td>Find in rundown</td>
              <td>
                <Kbd>{deviceMod}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>F</Kbd>
              </td>
            </tr>
            <tr>
              <td>Open Settings</td>
              <td>
                <Kbd>{deviceMod}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>,</Kbd>
              </td>
            </tr>
            <tr className={style.spacer} />
            <tr>
              <td>Select entry</td>
              <td>
                <Kbd>{deviceAlt}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>↑</Kbd>
                <AuxKey>/</AuxKey>
                <Kbd>↓</Kbd>
              </td>
            </tr>
            <tr>
              <td>Select group</td>
              <td>
                <Kbd>{deviceAlt}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>Shift</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>↑</Kbd>
                <AuxKey>/</AuxKey>
                <Kbd>↓</Kbd>
              </td>
            </tr>
            <tr>
              <td>Jump to top / bottom</td>
              <td>
                <Kbd>Home</Kbd>
                <AuxKey>/</AuxKey>
                <Kbd>End</Kbd>
              </td>
            </tr>
            <tr>
              <td>Page up / down</td>
              <td>
                <Kbd>PgUp</Kbd>
                <AuxKey>/</AuxKey>
                <Kbd>PgDn</Kbd>
              </td>
            </tr>
            <tr>
              <td>Deselect entry</td>
              <td>
                <Kbd>Esc</Kbd>
              </td>
            </tr>
            <tr className={style.spacer} />
            <tr>
              <td>Reorder selected entry</td>
              <td>
                <Kbd>{deviceAlt}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>{deviceMod}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>↑</Kbd>
                <AuxKey>/</AuxKey>
                <Kbd>↓</Kbd>
              </td>
            </tr>
            <tr>
              <td>Copy selected entry</td>
              <td>
                <Kbd>{deviceMod}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>C</Kbd>
              </td>
            </tr>
            <tr>
              <td>Cut selected entry</td>
              <td>
                <Kbd>{deviceMod}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>X</Kbd>
              </td>
            </tr>
            <tr>
              <td>Paste above</td>
              <td>
                <Kbd>{deviceMod}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>Shift</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>V</Kbd>
              </td>
            </tr>
            <tr>
              <td>Paste below</td>
              <td>
                <Kbd>{deviceMod}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>V</Kbd>
              </td>
            </tr>
            <tr>
              <td>Clone selected entry</td>
              <td>
                <Kbd>{deviceMod}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>D</Kbd>
              </td>
            </tr>
            <tr>
              <td>Delete selected entry</td>
              <td>
                <Kbd>{deviceAlt}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>Backspace</Kbd>
                <AuxKey>/</AuxKey>
              </td>
            </tr>
            <tr className={style.spacer} />
            <tr>
              <td>Add event below</td>
              <td>
                <Kbd>{deviceAlt}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>E</Kbd>
              </td>
            </tr>
            <tr>
              <td>Add event above</td>
              <td>
                <Kbd>{deviceAlt}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>Shift</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>E</Kbd>
              </td>
            </tr>
            <tr>
              <td>Add group below</td>
              <td>
                <Kbd>{deviceAlt}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>G</Kbd>
              </td>
            </tr>
            <tr>
              <td>Add group above</td>
              <td>
                <Kbd>{deviceAlt}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>Shift</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>G</Kbd>
              </td>
            </tr>
            <tr>
              <td>Add milestone below</td>
              <td>
                <Kbd>{deviceAlt}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>M</Kbd>
              </td>
            </tr>
            <tr>
              <td>Add milestone above</td>
              <td>
                <Kbd>{deviceAlt}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>Shift</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>M</Kbd>
              </td>
            </tr>
            <tr>
              <td>Add delay below</td>
              <td>
                <Kbd>{deviceAlt}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>D</Kbd>
              </td>
            </tr>
            <tr>
              <td>Add delay above</td>
              <td>
                <Kbd>{deviceAlt}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>Shift</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>D</Kbd>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuxKey({ children }: PropsWithChildren) {
  return <span className={style.divider}>{children}</span>;
}

function Kbd({ children }: PropsWithChildren) {
  return <span className={style.kbd}>{children}</span>;
}
