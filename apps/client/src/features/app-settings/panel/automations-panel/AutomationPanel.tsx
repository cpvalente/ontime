import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import { useAppSettingsScroll } from '../../AppSettingsScrollContext';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import AutomationSettingsForm from './AutomationSettingsForm';
import AutomationsList from './AutomationsList';
import TriggersList from './TriggersList';

export default function AutomationPanel({ location }: PanelBaseProps) {
  const { data, status } = useAutomationSettings();
  const { setActiveSection } = useAppSettingsScroll();
  const settingsRef = useScrollIntoView<HTMLDivElement>('settings', location, setActiveSection);
  const triggersRef = useScrollIntoView<HTMLDivElement>('triggers', location, setActiveSection);
  const automationsRef = useScrollIntoView<HTMLDivElement>('automations', location, setActiveSection);

  const isLoading = status === 'pending';
  const automationState = isLoading ? undefined : data.enabledAutomations;
  const oscInputState = isLoading ? undefined : data.enabledOscIn;

  return (
    <>
      <Panel.Header>Automation</Panel.Header>
      <Panel.Section>
        <Panel.Loader isLoading={isLoading} />
        <div ref={settingsRef}>
          <AutomationSettingsForm
            enabledAutomations={data.enabledAutomations}
            enabledOscIn={data.enabledOscIn}
            oscPortIn={data.oscPortIn}
            automationState={automationState}
            oscInputState={oscInputState}
          />
        </div>
        <div ref={automationsRef}>
          <AutomationsList automations={data.automations} enabledAutomations={automationState} />
        </div>
        <div ref={triggersRef}>
          <TriggersList triggers={data.triggers} automations={data.automations} enabledAutomations={automationState} />
        </div>
      </Panel.Section>
    </>
  );
}
