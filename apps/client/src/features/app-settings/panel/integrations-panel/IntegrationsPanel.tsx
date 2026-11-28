import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import AutomationSettingsForm from './AutomationSettingsForm';
import AutomationsList from './AutomationsList';
import McpSection from './McpSection';
import TriggersList from './TriggersList';

export default function IntegrationsPanel({ location }: PanelBaseProps) {
  const { data, status } = useAutomationSettings();
  const mcpRef = useScrollIntoView<HTMLDivElement>('mcp', location);
  const automationsRef = useScrollIntoView<HTMLDivElement>('automations', location);

  const isLoading = status === 'pending';
  const automationState = isLoading ? undefined : data.enabledAutomations;
  const oscInputState = isLoading ? undefined : data.enabledOscIn;

  return (
    <>
      <Panel.Header>Integrations</Panel.Header>
      <div ref={automationsRef}>
        <AutomationSettingsForm
          enabledAutomations={data.enabledAutomations}
          enabledOscIn={data.enabledOscIn}
          oscPortIn={data.oscPortIn}
          automationState={automationState}
          oscInputState={oscInputState}
          isLoading={isLoading}
        />
      </div>
      <div>
        <AutomationsList
          automations={data.automations}
          triggers={data.triggers}
          enabledAutomations={automationState}
          isLoading={isLoading}
        />
      </div>
      <div>
        <TriggersList triggers={data.triggers} automations={data.automations} isLoading={isLoading} />
      </div>
      <div ref={mcpRef}>
        <McpSection />
      </div>
    </>
  );
}
