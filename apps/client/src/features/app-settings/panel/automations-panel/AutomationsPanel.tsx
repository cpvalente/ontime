import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';

import AutomationSettingsForm from './AutomationSettingsForm';
import AutomationsForm from './AutomationsForm';
import BlueprintsList from './BlueprintsList';

export default function AutomationPanel({ location }: PanelBaseProps) {
  const { data } = useAutomationSettings();
  const settingsRef = useScrollIntoView<HTMLDivElement>('settings', location);
  const automationRef = useScrollIntoView<HTMLDivElement>('automations', location);
  const blueprintsRef = useScrollIntoView<HTMLDivElement>('blueprints', location);

  return (
    <>
      <Panel.Header>Automation</Panel.Header>
      <Panel.Section>
        <div ref={settingsRef}>
          <AutomationSettingsForm
            enabledAutomations={data.enabledAutomations}
            enabledOscIn={data.enabledOscIn}
            oscPortIn={data.oscPortIn}
          />
        </div>
        <div ref={automationRef}>
          <AutomationsForm automations={data.automations} blueprints={data.blueprints} />
        </div>
        <div ref={blueprintsRef}>
          <BlueprintsList blueprints={data.blueprints} />
        </div>
      </Panel.Section>
    </>
  );
}