import { Switch } from '@chakra-ui/react';

import { useEditorSettings } from '../../../../common/stores/editorSettings';
import * as Panel from '../PanelUtils';

export default function EditorSettingsForm() {
  const eventSettings = useEditorSettings((state) => state.eventSettings);
  const setShowQuickEntry = useEditorSettings((state) => state.setShowQuickEntry);
  const setLinkPrevious = useEditorSettings((state) => state.setLinkPrevious);
  const setDefaultPublic = useEditorSettings((state) => state.setDefaultPublic);

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>Editor settings</Panel.SubHeader>
        <Panel.Divider />
        <Panel.ListGroup>
          <Panel.ListItem>
            <Panel.Field
              title='Show quick entry'
              description='Whether the quick entry buttons show under selected event'
            />
            <Switch
              variant='ontime'
              size='lg'
              defaultChecked={eventSettings.showQuickEntry}
              onChange={(event) => setShowQuickEntry(event.target.checked)}
            />
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field
              title='Link previous'
              description='New events start time will be linked to the previous event'
            />
            <Switch
              variant='ontime'
              size='lg'
              defaultChecked={eventSettings.linkPrevious}
              onChange={(event) => setLinkPrevious(event.target.checked)}
            />
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field title='Default public' description='New events will be public' />
            <Switch
              variant='ontime'
              size='lg'
              defaultChecked={eventSettings.defaultPublic}
              onChange={(event) => setDefaultPublic(event.target.checked)}
            />
          </Panel.ListItem>
        </Panel.ListGroup>
      </Panel.Card>
    </Panel.Section>
  );
}
