import { useEffect, useState } from 'react';
import { SecondarySource } from 'ontime-types';

import Button from '../../../common/components/buttons/Button';
import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import Select from '../../../common/components/select/Select';
import { setMessage, useTimerViewControl } from '../../../common/hooks/useSocket';

import TimerPreview from './TimerPreview';

import style from './MessageControl.module.scss';

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

  const changeValue = (newValue: SecondarySource) => {
    // we can only update the remote if it is enabled
    if (secondarySource !== null) {
      setMessage.timerSecondarySource(newValue);
    }
    setValue(newValue);
  };

  return (
    <>
      <Select
        value={value}
        placeholder='Secondary source'
        options={[
          { value: 'aux1', label: 'Aux 1' },
          { value: 'aux2', label: 'Aux 2' },
          { value: 'aux3', label: 'Aux 3' },
          { value: 'secondary', label: 'Secondary message' },
        ]}
        onChange={changeValue}
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
