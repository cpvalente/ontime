import { SecondaryPlacement, SecondarySource } from 'ontime-types';
import { useEffect, useState } from 'react';

import Button from '../../../common/components/buttons/Button';
import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import RadioGroup from '../../../common/components/radio-group/RadioGroup';
import Select from '../../../common/components/select/Select';
import { setMessage, useTimerViewControl } from '../../../common/hooks/useSocket';
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
  const { secondarySource, secondaryPlacement } = useTimerViewControl();
  const [value, setValue] = useState<SecondarySource>('aux1');

  // sync secondary source with external changes
  useEffect(() => {
    if (secondarySource !== null) {
      setValue(secondarySource);
    }
  }, [secondarySource]);

  const isActive = secondarySource !== null;

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
          { value: 'aux1', label: 'Aux 1' },
          { value: 'aux2', label: 'Aux 2' },
          { value: 'aux3', label: 'Aux 3' },
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
      <Editor.Label htmlFor='secondary-placement'>Placement</Editor.Label>
      <RadioGroup<SecondaryPlacement>
        id='secondary-placement'
        orientation='horizontal'
        value={secondaryPlacement}
        disabled={!isActive}
        onValueChange={(placement) => setMessage.timerSecondaryPlacement(placement)}
        items={[
          { value: 'below', label: 'Below timer' },
          { value: 'main', label: 'Swap with timer' },
        ]}
      />
      <Button variant={isActive ? 'primary' : 'subtle'} fluid onClick={toggleSecondary} data-testid='toggle secondary'>
        Show secondary
      </Button>
    </>
  );
}
