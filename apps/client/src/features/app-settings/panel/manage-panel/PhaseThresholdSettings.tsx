import { PhaseThreshold, PhaseThresholds } from 'ontime-types';
import { useRef, useState } from 'react';

import { maybeAxiosError } from '../../../../common/api/utils';
import Info from '../../../../common/components/info/Info';
import PhaseThresholdInput from '../../../../common/components/input/phase-threshold-input/PhaseThresholdInput';
import useSettings, { useUpdateSettings } from '../../../../common/hooks-query/useSettings';
import * as Panel from '../../panel-utils/PanelUtils';

export const phaseDescription = {
  warning: 'When the timer enters warning, as time or percentage of the event duration before the end',
  danger: 'When the timer enters danger, as time or percentage of the event duration before the end',
};

export default function PhaseThresholdSettings() {
  const { data, status } = useSettings();
  const { updateSettings } = useUpdateSettings();
  const [error, setError] = useState<string | null>(null);
  // a save posts the whole settings, so we hold edits until they load
  const isDisabled = status !== 'success';
  // an edit made before the previous save lands builds on it, not on the settings we last rendered
  const unsavedThresholds = useRef<PhaseThresholds | null>(null);

  const submitPhase = async (phase: keyof PhaseThresholds, threshold: PhaseThreshold) => {
    const phaseThresholds = { ...(unsavedThresholds.current ?? data.phaseThresholds), [phase]: threshold };
    unsavedThresholds.current = phaseThresholds;
    try {
      setError(null);
      await updateSettings({ ...data, phaseThresholds });
    } catch (submitError) {
      setError(maybeAxiosError(submitError));
    } finally {
      if (unsavedThresholds.current === phaseThresholds) unsavedThresholds.current = null;
    }
  };

  return (
    <>
      <Panel.Title>Warning and danger</Panel.Title>
      <Info>
        Timers change colour when they reach warning and danger. These thresholds apply to every event in the project.
        Groups can override them, and each event can still set its own times in the event editor.
      </Info>
      <Panel.Loader isLoading={status === 'pending'} />
      {error && <Panel.Error>{error}</Panel.Error>}
      <Panel.ListGroup>
        <Panel.ListItem>
          <Panel.Field title='Warning' description={phaseDescription.warning} />
          <PhaseThresholdInput
            name='projectWarning'
            label='Warning'
            phase='warning'
            disabled={isDisabled}
            value={data.phaseThresholds.warning}
            onChange={(threshold) => submitPhase('warning', threshold)}
          />
        </Panel.ListItem>
        <Panel.ListItem>
          <Panel.Field title='Danger' description={phaseDescription.danger} />
          <PhaseThresholdInput
            name='projectDanger'
            label='Danger'
            phase='danger'
            disabled={isDisabled}
            value={data.phaseThresholds.danger}
            onChange={(threshold) => submitPhase('danger', threshold)}
          />
        </Panel.ListItem>
      </Panel.ListGroup>
    </>
  );
}
