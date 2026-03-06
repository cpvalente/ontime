import { CSSProperties, useCallback, useState } from 'react';
import { FaQuestion } from 'react-icons/fa6';
import { IoLink, IoLockClosed, IoLockOpenOutline, IoUnlink } from 'react-icons/io5';
import { CustomFields, EndAction, OntimeEvent, TimerType, TimeStrategy } from 'ontime-types';
import { parseUserTime } from 'ontime-utils';

import Button from '../../../../common/components/buttons/Button';
import IconButton from '../../../../common/components/buttons/IconButton';
import Dialog from '../../../../common/components/dialog/Dialog';
import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import Info from '../../../../common/components/info/Info';
import Input from '../../../../common/components/input/input/Input';
import SwatchSelect from '../../../../common/components/input/colour-input/SwatchSelect';
import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import AppLink from '../../../../common/components/link/app-link/AppLink';
import Select from '../../../../common/components/select/Select';
import Switch from '../../../../common/components/switch/Switch';
import Tooltip from '../../../../common/components/tooltip/Tooltip';
import { useEntryActionsContext } from '../../../../common/context/EntryActionsContext';
import useCustomFields from '../../../../common/hooks-query/useCustomFields';
import { getAccessibleColour } from '../../../../common/utils/styleUtils';
import TimeInputGroup from '../../time-input-flow/TimeInputGroup';
import EventEditorImage from '../composite/EventEditorImage';
import EventTextArea from '../composite/EventTextArea';
import EntryEditorTextInput from '../composite/EventTextInput';

import { isIndeterminate, MergedCustomFields } from './multiEditUtils';
import { useMultiEventMerge } from './useMultiEventMerge';

import editorStyle from '../EntryEditor.module.scss';
import style from './MultiEventEditor.module.scss';

export default function MultiEventEditor() {
  const { merged, selectedIds } = useMultiEventMerge();
  const { batchUpdateEvents } = useEntryActionsContext();
  const { data: customFields } = useCustomFields();
  const [pendingStrategy, setPendingStrategy] = useState<TimeStrategy | null>(null);

  const handleSubmit = useCallback(
    (field: string, value: string | boolean) => {
      if (field.startsWith('custom-')) {
        const fieldKey = field.split('custom-')[1];
        batchUpdateEvents({ custom: { [fieldKey]: value } } as Partial<OntimeEvent>, selectedIds);
      } else if (field === 'duration' || field === 'timeWarning' || field === 'timeDanger') {
        const ms = parseUserTime(value as string);
        batchUpdateEvents({ [field]: ms } as Partial<OntimeEvent>, selectedIds);
      } else {
        batchUpdateEvents({ [field]: value } as Partial<OntimeEvent>, selectedIds);
      }
    },
    [batchUpdateEvents, selectedIds],
  );

  const handleConfirmStrategy = useCallback(() => {
    if (pendingStrategy) {
      batchUpdateEvents({ timeStrategy: pendingStrategy }, selectedIds);
    }
    setPendingStrategy(null);
  }, [batchUpdateEvents, selectedIds, pendingStrategy]);

  if (!merged) {
    return null;
  }

  const titleValue = isIndeterminate(merged.title) ? '' : merged.title;
  const titlePlaceholder = isIndeterminate(merged.title) ? 'multiple' : undefined;
  const noteValue = isIndeterminate(merged.note) ? '' : merged.note;
  const notePlaceholder = isIndeterminate(merged.note) ? 'multiple' : undefined;
  const colourIndeterminate = isIndeterminate(merged.colour);
  const colourValue = colourIndeterminate ? '' : (merged.colour as string);
  const flagIndeterminate = isIndeterminate(merged.flag);
  const flagChecked = flagIndeterminate ? false : (merged.flag as boolean);
  const linkStartIndeterminate = isIndeterminate(merged.linkStart);
  const linkStartValue = linkStartIndeterminate ? false : (merged.linkStart as boolean);
  const allLinked = !linkStartIndeterminate && linkStartValue;
  const durationIndeterminate = isIndeterminate(merged.duration);
  const durationValue = durationIndeterminate ? undefined : (merged.duration as number);
  const durationEnabled = merged.allLockDuration;
  const durationLockIndeterminate = isIndeterminate(merged.timeStrategy);
  const endActionIndeterminate = isIndeterminate(merged.endAction);
  const endActionValue = endActionIndeterminate ? null : (merged.endAction as EndAction);
  const countToEndIndeterminate = isIndeterminate(merged.countToEnd);
  const countToEndChecked = countToEndIndeterminate ? false : (merged.countToEnd as boolean);
  const timerTypeIndeterminate = isIndeterminate(merged.timerType);
  const timerTypeValue = timerTypeIndeterminate ? null : (merged.timerType as TimerType);
  const timeWarningIndeterminate = isIndeterminate(merged.timeWarning);
  const timeWarningValue = timeWarningIndeterminate ? undefined : (merged.timeWarning as number);
  const timeDangerIndeterminate = isIndeterminate(merged.timeDanger);
  const timeDangerValue = timeDangerIndeterminate ? undefined : (merged.timeDanger as number);

  return (
    <div className={editorStyle.content}>
      <Info type='info'>
        <span className={style.bold}>Batch Edit:</span> <span className={style.underline}>{selectedIds.length} events</span>
      </Info>
      <div className={editorStyle.column}>
        <Editor.Title>Event Schedule</Editor.Title>
        <div className={editorStyle.inline}>
          <div>
            <Editor.Label>Start</Editor.Label>
            <TimeInputGroup>
              <span className={style.disabledInput}>&mdash;</span>
              <Tooltip
                text='Link start to previous end'
                onClick={() => handleSubmit('linkStart', !allLinked)}
                render={<IconButton variant='subtle-white' className={allLinked ? style.lockActive : style.lockInactive} />}
              >
                {linkStartIndeterminate ? <FaQuestion /> : allLinked ? <IoLink /> : <IoUnlink />}
              </Tooltip>
            </TimeInputGroup>
          </div>
          <div>
            <Editor.Label>End</Editor.Label>
            <TimeInputGroup>
              <span className={style.disabledInput}>&mdash;</span>
              <Tooltip
                text='Lock end'
                onClick={!merged.allLockEnd ? () => setPendingStrategy(TimeStrategy.LockEnd) : undefined}
                render={<IconButton variant='subtle-white' className={merged.allLockEnd ? style.lockActive : style.lockInactive} />}
              >
                {durationLockIndeterminate ? <FaQuestion /> : merged.allLockEnd ? <IoLockClosed /> : <IoLockOpenOutline />}
              </Tooltip>
            </TimeInputGroup>
          </div>
          <div>
            <Editor.Label>Duration</Editor.Label>
            <TimeInputGroup>
              {durationEnabled ? (
                <TimeInput name='duration' submitHandler={handleSubmit} time={durationValue} placeholder='multiple' />
              ) : (
                <span className={style.disabledInput}>&mdash;</span>
              )}
              <Tooltip
                text='Lock duration'
                onClick={!durationEnabled ? () => setPendingStrategy(TimeStrategy.LockDuration) : undefined}
                render={<IconButton variant='subtle-white' className={durationEnabled ? style.lockActive : style.lockInactive} />}
              >
                {durationLockIndeterminate ? <FaQuestion /> : durationEnabled ? <IoLockClosed /> : <IoLockOpenOutline />}
              </Tooltip>
            </TimeInputGroup>
          </div>
        </div>
      </div>
      <div className={editorStyle.column}>
        <Editor.Title>Event Behaviour</Editor.Title>
        <div className={editorStyle.splitTwo}>
          <div>
            <Editor.Label htmlFor='endAction'>End Action</Editor.Label>
            <Select
              value={endActionValue}
              onValueChange={(value) => value !== null && handleSubmit('endAction', value)}
              placeholder={endActionIndeterminate ? 'Mixed' : undefined}
              options={[
                { value: EndAction.None, label: 'None' },
                { value: EndAction.LoadNext, label: 'Load next event' },
                { value: EndAction.PlayNext, label: 'Play next event' },
              ]}
            />
          </div>
          <div>
            <Editor.Label htmlFor='countToEnd'>Count to End</Editor.Label>
            <Editor.Label className={editorStyle.switchLabel}>
              <Switch indeterminate={countToEndIndeterminate} checked={countToEndChecked} onCheckedChange={(value) => handleSubmit('countToEnd', value)} />
              {countToEndIndeterminate ? 'Mixed' : countToEndChecked ? 'On' : 'Off'}
            </Editor.Label>
          </div>
        </div>
      </div>
      <div className={editorStyle.column}>
        <Editor.Title>Display Options</Editor.Title>
        <div className={editorStyle.splitTwo}>
          <div>
            <Editor.Label htmlFor='timerType'>Timer Type</Editor.Label>
            <Select
              value={timerTypeValue}
              onValueChange={(value) => value !== null && handleSubmit('timerType', value)}
              placeholder={timerTypeIndeterminate ? 'Mixed' : undefined}
              options={[
                { value: TimerType.CountDown, label: 'Count down' },
                { value: TimerType.CountUp, label: 'Count up' },
                { value: TimerType.Clock, label: 'Clock' },
                { value: TimerType.None, label: 'None' },
              ]}
            />
          </div>
          <div className={editorStyle.inline}>
            <div>
              <Editor.Label htmlFor='timeWarning'>Warning Time</Editor.Label>
              <TimeInput id='timeWarning' name='timeWarning' submitHandler={handleSubmit} time={timeWarningValue} placeholder={timeWarningIndeterminate ? 'multiple' : 'Duration'} />
            </div>
            <div>
              <Editor.Label htmlFor='timeDanger'>Danger Time</Editor.Label>
              <TimeInput id='timeDanger' name='timeDanger' submitHandler={handleSubmit} time={timeDangerValue} placeholder={timeDangerIndeterminate ? 'multiple' : 'Duration'} />
            </div>
          </div>
        </div>
      </div>
      <div className={editorStyle.column}>
        <Editor.Title>Event Data</Editor.Title>
        <div className={editorStyle.splitThree}>
          <div>
            <Editor.Label htmlFor='eventId'>Event ID (read only)</Editor.Label>
            <Input id='eventId' data-testid='input-textfield' value='' readOnly disabled fluid />
          </div>
          <div>
            <Editor.Label htmlFor='cue'>Cue</Editor.Label>
            <Input id='cue' data-testid='input-textfield' value='' readOnly disabled fluid />
          </div>
          <div>
            <Editor.Label htmlFor='flag'>Flag</Editor.Label>
            <Editor.Label className={editorStyle.switchLabel}>
              <Switch indeterminate={flagIndeterminate} checked={flagChecked} onCheckedChange={(value) => handleSubmit('flag', value)} />
              {flagIndeterminate ? 'Mixed' : flagChecked ? 'On' : 'Off'}
            </Editor.Label>
          </div>
        </div>
        <div>
          <Editor.Label>Colour</Editor.Label>
          {colourIndeterminate && <Editor.Label className={style.hint}>Multiple colours selected</Editor.Label>}
          <SwatchSelect name='colour' value={colourValue} handleChange={handleSubmit} noSelection={colourIndeterminate} />
        </div>
        <EntryEditorTextInput
          field='title'
          label='Title'
          initialValue={titleValue}
          placeholder={titlePlaceholder}
          submitHandler={handleSubmit}
        />
        <EventTextArea field='note' label='Note' initialValue={noteValue} placeholder={notePlaceholder} submitHandler={handleSubmit} />
      </div>
      <div className={editorStyle.column}>
        <Editor.Title>
          Custom Fields
          <AppLink search='settings=manage__custom'>Manage Custom Fields</AppLink>
        </Editor.Title>
        {Object.keys(customFields).length > 0 && (
          <MultiEditCustomFields fields={customFields} mergedCustom={merged.custom} handleSubmit={handleSubmit} />
        )}
      </div>
      <div className={editorStyle.column}>
        <Editor.Title>Automations</Editor.Title>
        <Info type='info'>Not available when editing multiple events</Info>
      </div>
      <Dialog
        isOpen={pendingStrategy !== null}
        onClose={() => setPendingStrategy(null)}
        title='Warning!'
        showBackdrop
        showCloseButton
        bodyElements={
          <>
            {pendingStrategy === TimeStrategy.LockDuration
              ? 'This will set duration lock for all selected events and may significantly impact this rundown\'s total duration.'
              : 'This will set end lock for all selected events and may significantly impact this rundown\'s total duration.'}
          </>
        }
        footerElements={
          <>
            <Button variant='ghosted-white' size='large' onClick={() => setPendingStrategy(null)}>
              No
            </Button>
            <Button variant='destructive' size='large' onClick={handleConfirmStrategy}>
              Yes
            </Button>
          </>
        }
      />
    </div>
  );
}

interface MultiEditCustomFieldsProps {
  fields: CustomFields;
  mergedCustom: MergedCustomFields;
  handleSubmit: (field: string, value: string) => void;
}

function MultiEditCustomFields({ fields, mergedCustom, handleSubmit }: MultiEditCustomFieldsProps) {
  return (
    <>
      {Object.keys(fields).map((fieldKey) => {
        const fieldName = `custom-${fieldKey}`;
        const mergedValue = mergedCustom[fieldKey];
        const indeterminate = mergedValue === undefined || isIndeterminate(mergedValue);
        const initialValue = indeterminate ? '' : mergedValue;
        const placeholder = indeterminate ? 'multiple' : undefined;
        const { backgroundColor, color } = getAccessibleColour(fields[fieldKey].colour);
        const labelStyle = { '--decorator-bg': backgroundColor, '--decorator-color': color } as CSSProperties;
        const labelText = fields[fieldKey].label;

        if (fields[fieldKey].type === 'text') {
          return (
            <EventTextArea
              key={fieldKey}
              field={fieldName}
              label={labelText}
              initialValue={initialValue}
              placeholder={placeholder}
              submitHandler={handleSubmit}
              className={editorStyle.decorated}
              style={labelStyle}
            />
          );
        }

        if (fields[fieldKey].type === 'image') {
          return (
            <div key={fieldKey} className={editorStyle.customImage}>
              <EntryEditorTextInput
                field={fieldName}
                label={labelText}
                initialValue={initialValue}
                placeholder={placeholder ?? 'Paste image URL'}
                submitHandler={handleSubmit}
                className={editorStyle.decorated}
                maxLength={255}
                style={labelStyle}
              />
              {!indeterminate && <EventEditorImage src={initialValue} />}
            </div>
          );
        }

        return null;
      })}
    </>
  );
}
