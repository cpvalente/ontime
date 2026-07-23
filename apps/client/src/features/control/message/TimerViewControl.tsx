import { SecondarySource } from 'ontime-types';
import { useEffect, useState } from 'react';

import Button from '../../../common/components/buttons/Button';
import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import Select from '../../../common/components/select/Select';
import useSettings from '../../../common/hooks-query/useSettings';
import { setMessage, useTimerViewControl } from '../../../common/hooks/useSocket';
import { getAuxTimerLabel } from '../../../common/utils/auxTimerUtils';
import TimerPreview from './TimerPreview';

import style from './TimerViewControl.module.scss';

export default function TimerControlsPreview() {
  const { blackout, blink } = useTimerViewControl();

  return (
    <div className={style.previewContainer}>
      <TimerPreview />
      <div className={style.options}>
        <SecondarySourceControl />

        <Editor.Separator orientation='horizontal' />

        <Button
          variant={blink ? 'primary' : 'subtle'}
          fluid
          onClick={() => setMessage.timerBlink(!blink)}
          data-testid='toggle timer blink'
        >
          Blink
        </Button>
        <Button
          variant={blackout ? 'primary' : 'subtle'}
          fluid
          onClick={() => setMessage.timerBlackout(!blackout)}
          data-testid='toggle timer blackout'
        >
          Blackout screen
        </Button>
      </div>
    </div>
  );
}

function SecondarySourceControl() {
  const { secondarySource } = useTimerViewControl();
  const { data: settings } = useSettings();
  const [value, setValue] = useState<SecondarySource>('aux1');

  // sync secondary source with external changes
  useEffect(() => {
    if (secondarySource !== null) {
      setValue(secondarySource);
    }
  }, [secondarySource]);

  const toggleSecondary = () => {
    if (secondarySource === value) {
      setMessage.timerSecondarySource(null);
    } else {
      setMessage.timerSecondarySource(value);
    }
  };

  return (
    <>
      <Select
        value={value}
        options={[
          { value: 'aux1', label: getAuxTimerLabel(settings.auxTimerNames, 1, 'Aux 1') },
          { value: 'aux2', label: getAuxTimerLabel(settings.auxTimerNames, 2, 'Aux 2') },
          { value: 'aux3', label: getAuxTimerLabel(settings.auxTimerNames, 3, 'Aux 3') },
          { value: 'secondary', label: 'Secondary message' },
        ]}
        onValueChange={(value: SecondarySource | null) => {
          if (value === null) return;
          // we can only update the remote if it is enabled
          if (secondarySource !== null) {
            setMessage.timerSecondarySource(value);
          }
          setValue(value);
        }}
      />
      <Button
        variant={secondarySource !== null ? 'primary' : 'subtle'}
        fluid
        onClick={toggleSecondary}
        data-testid='toggle secondary'
      >
        Show secondary
      </Button>
    </>
  );
}
