import { SecondarySource } from 'ontime-types';
import { KeyboardEvent, useState } from 'react';

import Input from '../../../common/components/input/input/Input';
import Select from '../../../common/components/select/Select';
import { setMessage, useSecondaryInput, useTimerMessageInput } from '../../../common/hooks/useSocket';
import InputRow from './InputRow';
import TimerControlsPreview from './TimerViewControl';

export default function MessageControl() {
  return (
    <>
      <TimerControlsPreview />
      <SecondaryInput />
      <TimerMessageInput />
    </>
  );
}

function TimerMessageInput() {
  const { text, visible } = useTimerMessageInput();
  // unsent change, null while the field shows what is live
  const [edited, setEdited] = useState<string | null>(null);

  const draft = edited ?? text;
  const isPending = visible && draft !== text;

  const apply = () => {
    setMessage.showTimerMessage(draft);
    setEdited(null);
  };

  const handleButton = () => {
    if (visible && !isPending) {
      setMessage.timerVisible(false);
    } else {
      apply();
    }
  };

  return (
    <InputRow label='Timer message' isLive={visible} isPending={isPending} onButtonClick={handleButton}>
      <Input
        fluid
        aria-label='Timer message'
        placeholder='Message shown fullscreen in stage timer'
        value={draft}
        onChange={(event) => setEdited(event.target.value)}
        onKeyDown={(event) => handleDraftKeys(event, isPending, apply, () => setEdited(null))}
      />
    </InputRow>
  );
}

type Source = NonNullable<SecondarySource>;

const secondarySourceOptions: { value: Source; label: string }[] = [
  { value: 'aux1', label: 'Aux 1' },
  { value: 'aux2', label: 'Aux 2' },
  { value: 'aux3', label: 'Aux 3' },
  { value: 'secondary', label: 'Message' },
];

function SecondaryInput() {
  const { text, source } = useSecondaryInput();
  // unsent change, null while the field shows what is live
  const [edited, setEdited] = useState<{ source: Source; text: string } | null>(null);

  const draft = edited ?? { source: source ?? 'secondary', text };
  const isLive = source !== null;
  const isPending = isLive && (draft.source !== source || (draft.source === 'secondary' && draft.text !== text));

  const apply = () => {
    setMessage.showSecondary(draft.source, draft.text);
    setEdited(null);
  };

  const handleButton = () => {
    if (isLive && !isPending) {
      setMessage.timerSecondarySource(null);
      // keep the hidden content, ready to show again
      setEdited(draft);
    } else {
      apply();
    }
  };

  const isMessage = draft.source === 'secondary';

  return (
    <InputRow
      label='Secondary'
      isLive={isLive}
      isPending={isPending}
      onButtonClick={handleButton}
      data-testid='toggle secondary'
    >
      <Select
        aria-label='Secondary source'
        value={draft.source}
        options={secondarySourceOptions}
        onValueChange={(value: Source | null) => {
          if (value === null) return;
          setEdited({ ...draft, source: value });
        }}
      />
      <Input
        fluid
        aria-label='Secondary message'
        disabled={!isMessage}
        placeholder={isMessage ? 'Secondary text' : 'Used when the source is Message'}
        value={draft.text}
        onChange={(event) => setEdited({ ...draft, text: event.target.value })}
        onKeyDown={(event) => handleDraftKeys(event, isPending, apply, () => setEdited(null))}
      />
    </InputRow>
  );
}

function handleDraftKeys(
  event: KeyboardEvent<HTMLInputElement>,
  isPending: boolean,
  apply: () => void,
  discard: () => void,
) {
  // these keys also end an input method composition
  if (event.nativeEvent.isComposing) return;
  if (event.key === 'Enter' && isPending) {
    apply();
  } else if (event.key === 'Escape') {
    discard();
  }
}
