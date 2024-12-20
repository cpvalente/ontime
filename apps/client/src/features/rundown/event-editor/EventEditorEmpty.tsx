import { memo, PropsWithChildren } from 'react';
import { Kbd } from '@chakra-ui/react';

import { deviceAlt, deviceMod } from '../../../common/utils/deviceUtils';
import * as Editor from '../../editors/editor-utils/EditorUtils';

import style from './EventEditorEmpty.module.scss';

export default memo(EventEditorEmpty);

function EventEditorEmpty() {
  return (
    <div className={style.eventEditor} data-testid='editor-container'>
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
              <td>Select block</td>
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
              <td>Delete selected entry</td>
              <td>
                <Kbd>{deviceMod}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>Backspace</Kbd>
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
              <td>Add block below</td>
              <td>
                <Kbd>{deviceAlt}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>B</Kbd>
              </td>
            </tr>
            <tr>
              <td>Add block above</td>
              <td>
                <Kbd>{deviceAlt}</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>Shift</Kbd>
                <AuxKey>+</AuxKey>
                <Kbd>B</Kbd>
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
