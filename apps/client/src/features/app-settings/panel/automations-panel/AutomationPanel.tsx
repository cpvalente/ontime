import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';

import AutomationSettingsForm from './AutomationSettingsForm';
import AutomationsList from './AutomationsList';
import BlueprintsList from './BlueprintsList';

export default function AutomationPanel({ location }: PanelBaseProps) {
  const { data, status } = useAutomationSettings();
  const settingsRef = useScrollIntoView<HTMLDivElement>('settings', location);
  const automationRef = useScrollIntoView<HTMLDivElement>('automations', location);
  const blueprintsRef = useScrollIntoView<HTMLDivElement>('blueprints', location);

  const isLoading = status === 'pending';

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
          />
        </div>
        <div ref={automationRef}>
          <AutomationsList automations={data.automations} blueprints={data.blueprints} />
        </div>
        <div ref={blueprintsRef}>
          <BlueprintsList blueprints={data.blueprints} />
        </div>
      </Panel.Section>
    </>
  );
}
