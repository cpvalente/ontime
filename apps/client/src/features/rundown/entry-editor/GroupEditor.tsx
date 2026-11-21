import { MaybeNumber, OntimeGroup, PhaseThreshold, PhaseThresholds } from 'ontime-types';
import { millisToString } from 'ontime-utils';
import { useCallback } from 'react';

import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import SwatchSelect from '../../../common/components/input/colour-input/SwatchSelect';
import PhaseThresholdInput from '../../../common/components/input/phase-threshold-input/PhaseThresholdInput';
import AppLink from '../../../common/components/link/app-link/AppLink';
import Switch from '../../../common/components/switch/Switch';
import { useEntryActionsContext } from '../../../common/context/EntryActionsContext';
import useCustomFields from '../../../common/hooks-query/useCustomFields';
import useSettings from '../../../common/hooks-query/useSettings';
import { getOffsetState } from '../../../common/utils/offset';
import { cx, enDash } from '../../../common/utils/styleUtils';
import { formatTime } from '../../../common/utils/time';
import TextLikeInput from '../../../views/cuesheet/cuesheet-table/cuesheet-table-elements/TextLikeInput';
import EntryEditorCustomFields from './composite/EventEditorCustomFields';
import EventTextArea from './composite/EventTextArea';
import EntryEditorTextInput from './composite/EventTextInput';
import TargetDurationInput from './composite/TargetDurationInput';

import style from './EntryEditor.module.scss';

// title + colour + custom field labels
export type GroupEditorUpdateTextFields = 'title' | 'colour' | string;
export type GroupEditorUpdateMaybeNumberFields = 'targetDuration';

interface GroupEditorProps {
  group: OntimeGroup;
}

export default function GroupEditor({ group }: GroupEditorProps) {
  const { data: customFields } = useCustomFields();
  const { updateEntry } = useEntryActionsContext();

  const handleSubmit = useCallback(
    (field: GroupEditorUpdateTextFields | GroupEditorUpdateMaybeNumberFields, value: string | MaybeNumber) => {
      // Handle custom fields
      if (typeof field === 'string' && field.startsWith('custom-')) {
        const fieldLabel = field.split('custom-')[1];
        updateEntry({ id: group.id, custom: { [fieldLabel]: value as string } });
        return;
      }

      if (field === 'targetDuration') {
        return updateEntry({ id: group.id, targetDuration: value as MaybeNumber });
      }

      // all other strings are text fields
      return updateEntry({ id: group.id, [field]: value as string });
    },
    [group.id, updateEntry],
  );

  const isEditor = window.location.pathname.includes('editor');
  const planOffset = group.targetDuration === null ? null : group.duration - group.targetDuration;
  const planOffsetLabel = planOffset !== null ? getOffsetState(planOffset) : null;

  return (
    <div className={style.content}>
      <div className={style.column}>
        <Editor.Title>Group schedule</Editor.Title>
        <div className={style.inline}>
          <div>
            <Editor.Label>First event start</Editor.Label>
            <TextLikeInput className={style.textLikeInput} disabled>
              {formatTime(group.timeStart)}
            </TextLikeInput>
          </div>
          <div>
            <Editor.Label>Last event end</Editor.Label>
            <TextLikeInput className={style.textLikeInput} disabled>
              {formatTime(group.timeEnd)}
            </TextLikeInput>
          </div>
          <div>
            <Editor.Label htmlFor='duration'>Scheduled duration</Editor.Label>
            <TextLikeInput className={style.textLikeInput} disabled>
              {millisToString(group.duration, { fallback: enDash })}
            </TextLikeInput>
          </div>
        </div>
        <div className={style.inline}>
          <div>
            <Editor.Label htmlFor='eventId'>Plan offset</Editor.Label>
            <TextLikeInput
              offset={planOffsetLabel === 'under' ? 'over' : planOffsetLabel}
              className={cx([style.textLikeInput, planOffset === null && style.inactive])}
              disabled
            >
              {planOffset !== null && planOffset > 0 ? '+' : ''}
              {millisToString(planOffset, { fallback: enDash })}
            </TextLikeInput>
          </div>
          <TargetDurationInput
            duration={group.duration}
            targetDuration={group.targetDuration}
            submitHandler={handleSubmit}
          />
        </div>
      </div>

      <GroupPhaseThresholds groupId={group.id} phaseThresholds={group.phaseThresholds} />

      <div className={style.column}>
        <Editor.Title>Group data</Editor.Title>
        <div>
          <Editor.Label>Colour</Editor.Label>
          <SwatchSelect name='colour' value={group.colour} handleChange={handleSubmit} />
        </div>
        <EntryEditorTextInput field='title' label='Title' initialValue={group.title} submitHandler={handleSubmit} />
        <EventTextArea field='note' label='Note' initialValue={group.note} submitHandler={handleSubmit} />
      </div>

      <div className={style.column}>
        <Editor.Title>
          Custom Fields
          {isEditor && <AppLink search='settings=manage__custom'>Manage Custom Fields</AppLink>}
        </Editor.Title>
        <EntryEditorCustomFields customFields={customFields} handleSubmit={handleSubmit} entry={group} />
      </div>
    </div>
  );
}

interface GroupPhaseThresholdsProps {
  groupId: string;
  phaseThresholds: PhaseThresholds | null;
}

function GroupPhaseThresholds({ groupId, phaseThresholds }: GroupPhaseThresholdsProps) {
  const { updateEntry } = useEntryActionsContext();
  const { data: settings } = useSettings();
  const isOverride = phaseThresholds !== null;

  const submit = (newThresholds: PhaseThresholds | null) => {
    updateEntry({ id: groupId, phaseThresholds: newThresholds });
  };

  const submitPhase = (phase: keyof PhaseThresholds, threshold: PhaseThreshold) => {
    if (!phaseThresholds) return;
    submit({ ...phaseThresholds, [phase]: threshold });
  };

  return (
    <div className={style.column}>
      <Editor.Title>Warning and danger</Editor.Title>
      <div>
        <Editor.Label htmlFor='groupPhaseOverride'>Override project thresholds</Editor.Label>
        <Editor.Label className={style.switchLabel}>
          <Switch
            id='groupPhaseOverride'
            checked={isOverride}
            onCheckedChange={(checked) => submit(checked ? settings.phaseThresholds : null)}
          />
          {isOverride ? 'On' : 'Off, uses the project thresholds'}
        </Editor.Label>
      </div>
      {phaseThresholds && (
        <div className={style.splitTwo}>
          <div>
            <Editor.Label htmlFor='groupWarning'>Warning</Editor.Label>
            <PhaseThresholdInput
              name='groupWarning'
              label='Warning'
              phase='warning'
              value={phaseThresholds.warning}
              onChange={(threshold) => submitPhase('warning', threshold)}
            />
          </div>
          <div>
            <Editor.Label htmlFor='groupDanger'>Danger</Editor.Label>
            <PhaseThresholdInput
              name='groupDanger'
              label='Danger'
              phase='danger'
              value={phaseThresholds.danger}
              onChange={(threshold) => submitPhase('danger', threshold)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
