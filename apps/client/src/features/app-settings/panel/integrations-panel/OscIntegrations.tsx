import { Button, IconButton, Input, Select, Switch } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';

import * as Panel from '../PanelUtils';

import { cycles } from './IntegrationsPanel';

import style from './IntegrationsPanel.module.css';

const demoIntegrations = [
  { id: 1, enabled: true, cycle: 'onLoad', message: '/ontime/scene/1' },
  { id: 2, enabled: true, cycle: 'onLoad', message: '/ontime/scene/2' },
  { id: 3, enabled: true, cycle: 'onLoad', message: '/ontime/scene/3' },
  { id: 4, enabled: true, cycle: 'onLoad', message: '/ontime/scene/4' },
];

export default function OscIntegrations() {
  return (
    <Panel.Section>
      <Panel.Section>
        <Panel.SubHeader>Open Sound Control integrations</Panel.SubHeader>
        <Panel.ListGroup>
          <Panel.ListItem>
            <Panel.Field title='OSC input' description='Allow control of Ontime through OSC' />
            <Switch variant='ontime' size='lg' />
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field title='Listen on port' description='Port for incoming OSC. Default: 8888' />
            <Input
              id='portIn'
              placeholder='8888'
              width='75px'
              size='sm'
              textAlign='right'
              maxLength={5}
              variant='ontime-filled'
            />
          </Panel.ListItem>
        </Panel.ListGroup>
        <Panel.ListGroup>
          <Panel.ListItem>
            <Panel.Field title='OSC output' description='Provide feedback from Ontime with OSC' />
            <Switch variant='ontime' size='lg' />
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field title='OSC target IP' description='IP address Ontime will send OSC messages to' />
            <Input
              id='portIn'
              placeholder='8888'
              width='75px'
              size='sm'
              textAlign='right'
              maxLength={5}
              variant='ontime-filled'
            />
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field title='OSC target port' description='Port number Ontime will send OSC messages to' />
            <Input id='portIn' placeholder='8888' width='75px' size='sm' textAlign='right' variant='ontime-filled' />
          </Panel.ListItem>
        </Panel.ListGroup>
      </Panel.Section>

      <Panel.Card>
        <Panel.SubHeader>
          OSC Integration
          <Button variant='ontime-subtle' size='sm' rightIcon={<IoAdd />} onClick={() => undefined}>
            New
          </Button>
        </Panel.SubHeader>
        <Panel.Table>
          <thead>
            <tr>
              <th>Enabled</th>
              <th>Cycle</th>
              <th className={style.fullWidth}>Message</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {demoIntegrations.map((integration) => (
              <tr key={integration.id}>
                <td>
                  <Switch variant='ontime' />
                </td>
                <td className={style.autoWidth}>
                  <Select size='sm' variant='ontime' className={style.fitContents}>
                    {cycles.map((cycle) => (
                      <option key={cycle.id} value={cycle.value}>
                        {cycle.label}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className={style.fullWidth}>
                  <Input size='sm' variant='ontime-filled' value={integration.message} />
                </td>
                <td>
                  <IconButton
                    size='sm'
                    variant='ontime-ghosted'
                    color='#FA5656' // $red-500
                    icon={<IoTrash />}
                    aria-label='Delete entry'
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Panel.Table>
      </Panel.Card>
    </Panel.Section>
  );
}
