import { Alert, AlertDescription, AlertIcon, IconButton } from '@chakra-ui/react';
import { IoPencil } from '@react-icons/all-files/io5/IoPencil';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';

import ExternalLink from '../../../../common/components/external-link/ExternalLink';
import * as Panel from '../PanelUtils';

import style from './ProjectSettingsPanel.module.scss';

const demoCustomFields = {
  Apple: { value: 'Fruit' },
  Dog: { value: 'Animal' },
  Sun: { value: 'Star' },
  Car: { value: 'Vehicle' },
  Tree: { value: 'Plant' },
  Bird: { value: 'Creature' },
  Book: { value: 'Reading' },
  Chair: { value: 'Furniture' },
  Music: { value: 'Melody' },
  Ocean: { value: 'Sea' },
};

const userFieldsDocsUrl = 'https://ontime.gitbook.io/v2/features/user-fields';

export default function ProjectSettingsPanel() {
  return (
    <>
      <Panel.Header>Project Settings</Panel.Header>
      <Panel.Section>
        <Panel.Card>
          <Panel.SubHeader>Custom fields</Panel.SubHeader>
          <div>
            <Alert status='info' variant='ontime-on-dark-info'>
              <AlertIcon />
              <AlertDescription>
                Custom fields allow for additional information to be added to an event (eg. light, sound, camera).{' '}
                <br />
                This data is not used by Ontime. <br />
                <ExternalLink href={userFieldsDocsUrl}>See the docs</ExternalLink>
              </AlertDescription>
            </Alert>
          </div>
          <Panel.Table>
            <thead>
              <tr>
                <th>Name</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {Object.entries(demoCustomFields).map(([key, { value }]) => (
                <tr key={key}>
                  <td className={style.fullWidth}>{value}</td>
                  <td className={style.actions}>
                    <IconButton
                      size='sm'
                      variant='ontime-ghosted'
                      color='#e2e2e2' // $gray-200
                      icon={<IoPencil />}
                      aria-label='Edit entry'
                    />
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
    </>
  );
}
