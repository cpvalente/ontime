import { useEffect } from 'react';

import Input from '../../../common/components/input/input/Input';
import Select from '../../../common/components/select/Select';
import { setMessage, useQuestionControl } from '../../../common/hooks/useSocket';
import { useClientStore } from '../../../common/stores/clientStore';
import { cx } from '../../../common/utils/styleUtils';

import style from './QuestionControl.module.scss';

const MAX_ANSWERS = 3;
const DEFAULT_ANSWERS = ['Yes', 'No', ''];

export default function QuestionControl() {
  const { enabled, target, answers, answer } = useQuestionControl();
  const clients = useClientStore((store) => store.clients);

  // the displayed defaults are only real once committed to the server, otherwise
  // a viewer never receives them unless the controller happens to edit a field first
  useEffect(() => {
    if (enabled && answers.length === 0) {
      setMessage.answerOptions(DEFAULT_ANSWERS);
    }
  }, [enabled, answers.length]);

  // keep the panel visible after an answer comes in (enabled auto-resets) until the controller clears it
  if (!enabled && answer === null) {
    return null;
  }

  // answers only ever render on the Timer view, so only offer clients currently on it as a target
  const targetOptions = [
    { value: '', label: 'Select a client' },
    ...Object.entries(clients)
      .filter(([_, client]) => client.type === 'ontime' && client.path.startsWith('/timer'))
      .map(([id, client]) => ({ value: id, label: client.name })),
  ];

  const paddedAnswers = Array.from(
    { length: MAX_ANSWERS },
    (_, index) => answers[index] ?? DEFAULT_ANSWERS[index] ?? '',
  );

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...paddedAnswers];
    newAnswers[index] = value;
    setMessage.answerOptions(newAnswers);
    // editing a label makes any answer shown against the old labels stale; re-arming
    // (which the server always pairs with clearing the answer) keeps the panel open to edit
    if (answer !== null) {
      setMessage.questionEnabled(true);
    }
  };

  return (
    <div>
      <label className={style.label}>Quick Responses</label>
      <div className={style.grid}>
        {paddedAnswers.map((option, index) => {
          const isReceived = option !== '' && option === answer;
          return (
            <Input
              key={`question-answer-${index}`}
              value={option}
              placeholder='Empty'
              maxLength={40}
              className={cx([style.answer, isReceived && style.received])}
              onChange={(event) => handleAnswerChange(index, event.target.value)}
            />
          );
        })}
      </div>

      <div className={style.targetRow}>
        <span className={style.label}>Target Client</span>
        <Select
          options={targetOptions}
          value={target ?? ''}
          onValueChange={(value: string | null) => setMessage.questionTarget(value === '' ? null : value)}
          fluid
        />
      </div>
    </div>
  );
}
