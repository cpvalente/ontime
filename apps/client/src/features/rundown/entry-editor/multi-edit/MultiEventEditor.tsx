import { CSSProperties, useCallback } from 'react';
import { IoLockClosed, IoLockOpenOutline } from 'react-icons/io5';
import { useDisclosure } from '@mantine/hooks';
import { CustomFields, OntimeEvent, TimeField, TimeStrategy } from 'ontime-types';
import { parseUserTime } from 'ontime-utils';

import Button from '../../../../common/components/buttons/Button';
import IconButton from '../../../../common/components/buttons/IconButton';
import Dialog from '../../../../common/components/dialog/Dialog';
import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import Info from '../../../../common/components/info/Info';
import SwatchSelect from '../../../../common/components/input/colour-input/SwatchSelect';
import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import Switch from '../../../../common/components/switch/Switch';
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
  const [isLockDialogOpen, lockDialogHandlers] = useDisclosure();

  const handleSubmit = useCallback(
    (field: string, value: string) => {
      if (field.startsWith('custom-')) {
        const fieldKey = field.split('custom-')[1];
        batchUpdateEvents({ custom: { [fieldKey]: value } } as Partial<OntimeEvent>, selectedIds);
      } else {
        batchUpdateEvents({ [field]: value } as Partial<OntimeEvent>, selectedIds);
      }
    },
    [batchUpdateEvents, selectedIds],
  );

  const handleFlag = useCallback(
    (newValue: boolean) => {
      batchUpdateEvents({ flag: newValue }, selectedIds);
    },
    [batchUpdateEvents, selectedIds],
  );

  const handleDurationSubmit = useCallback(
    (_field: TimeField, value: string) => {
      const ms = parseUserTime(value);
      batchUpdateEvents({ duration: ms }, selectedIds);
    },
    [batchUpdateEvents, selectedIds],
  );

  const handleConfirmLockDuration = useCallback(() => {
    batchUpdateEvents({ timeStrategy: TimeStrategy.LockDuration }, selectedIds);
    lockDialogHandlers.close();
  }, [batchUpdateEvents, selectedIds, lockDialogHandlers]);

  if (!merged) {
    return null;
  }

  const titleValue = isIndeterminate(merged.title) ? '' : merged.title;
  const titlePlaceholder = isIndeterminate(merged.title) ? 'Multiple values' : undefined;
  const noteValue = isIndeterminate(merged.note) ? '' : merged.note;
  const colourValue = isIndeterminate(merged.colour) ? '' : merged.colour;
  const flagIndeterminate = isIndeterminate(merged.flag);
  const flagChecked = flagIndeterminate ? false : (merged.flag as boolean);
  const durationValue = isIndeterminate(merged.duration) ? 0 : merged.duration;
  const durationEnabled = merged.allLockDuration;

  return (
    <div className={editorStyle.content}>
      <Info type='info'>
        <span className={style.bold}>Batch Edit:</span> <span className={style.underline}>{selectedIds.length} events</span>
      </Info>
      <div className={editorStyle.column}>
        <Editor.Title>Event Schedule</Editor.Title>
        <div>
          <Editor.Label>Duration</Editor.Label>
          <TimeInputGroup>
            {durationEnabled ? (
              <TimeInput name='duration' submitHandler={handleDurationSubmit} time={durationValue} />
            ) : (
              <span className={style.disabledDuration}>-</span>
            )}
            <IconButton
              variant='subtle-white'
              className={durationEnabled ? style.lockActive : style.lockInactive}
              onClick={!durationEnabled ? lockDialogHandlers.open : undefined}
            >
              {durationEnabled ? <IoLockClosed /> : <IoLockOpenOutline />}
            </IconButton>
          </TimeInputGroup>
          {!durationEnabled && <Editor.Label className={style.hint}>All events must have duration lock</Editor.Label>}
        </div>
      </div>
      <div className={editorStyle.column}>
        <Editor.Title>Event Data</Editor.Title>
        <div>
          <Editor.Label htmlFor='flag'>Flag</Editor.Label>
          <Editor.Label className={editorStyle.switchLabel}>
            <Switch indeterminate={flagIndeterminate} checked={flagChecked} onCheckedChange={handleFlag} />
            {flagIndeterminate ? 'Mixed' : flagChecked ? 'On' : 'Off'}
          </Editor.Label>
        </div>
        <div>
          <Editor.Label>Colour</Editor.Label>
          <SwatchSelect name='colour' value={colourValue} handleChange={handleSubmit} />
        </div>
        <EntryEditorTextInput
          field='title'
          label='Title'
          initialValue={titleValue}
          placeholder={titlePlaceholder}
          submitHandler={handleSubmit}
        />
        <EventTextArea field='note' label='Note' initialValue={noteValue} submitHandler={handleSubmit} />
      </div>
      {Object.keys(customFields).length > 0 && (
        <div className={editorStyle.column}>
          <Editor.Title>Custom Fields</Editor.Title>
          <MultiEditCustomFields fields={customFields} mergedCustom={merged.custom} handleSubmit={handleSubmit} />
        </div>
      )}
      <Dialog
        isOpen={isLockDialogOpen}
        onClose={lockDialogHandlers.close}
        title='Change time strategy'
        showBackdrop
        showCloseButton
        bodyElements={
          <>
            This will set duration lock for all selected events and significantly impact this rundowns total duration.
          </>
        }
        footerElements={
          <>
            <Button variant='ghosted-white' size='large' onClick={lockDialogHandlers.close}>
              No
            </Button>
            <Button variant='destructive' size='large' onClick={handleConfirmLockDuration}>
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
        const placeholder = indeterminate ? 'Multiple values' : undefined;
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
