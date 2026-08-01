import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import AutomationSettingsForm from './AutomationSettingsForm';
import AutomationsList from './AutomationsList';
import TriggersList from './TriggersList';

export default function AutomationPanel({ location }: PanelBaseProps) {
  const { data, status } = useAutomationSettings();
  const settingsRef = useScrollIntoView<HTMLDivElement>('settings', location);
  const triggersRef = useScrollIntoView<HTMLDivElement>('triggers', location);
  const automationsRef = useScrollIntoView<HTMLDivElement>('automations', location);

  const isLoading = status === 'pending';
  const automationState = isLoading ? undefined : data.enabledAutomations;
  const oscInputState = isLoading ? undefined : data.enabledOscIn;

  return (
    <>
      <Panel.Header>Automation</Panel.Header>
      <div ref={settingsRef}>
        <AutomationSettingsForm
          enabledAutomations={data.enabledAutomations}
          enabledOscIn={data.enabledOscIn}
          oscPortIn={data.oscPortIn}
          automationState={automationState}
          oscInputState={oscInputState}
          isLoading={isLoading}
        />
      </div>
      <div ref={automationsRef}>
        <AutomationsList automations={data.automations} enabledAutomations={automationState} isLoading={isLoading} />
      </div>
      <div ref={triggersRef}>
        <TriggersList
          triggers={data.triggers}
          automations={data.automations}
          enabledAutomations={automationState}
          isLoading={isLoading}
        />
      </div>
    </>
  );
}
