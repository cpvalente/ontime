import { ModalBody, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { GoogleOAuthProvider } from '@react-oauth/google';

import ModalWrapper from '../ModalWrapper';

import AliasesForm from './AliasesForm';
import AppSettingsModal from './AppSettings';
import CuesheetSettingsForm from './CuesheetSettingsForm';
import EditorSettings from './EditorSettings';
import EventDataForm from './EventDataForm';
import SyncForm from './SyncForm';
import ViewSettingsForm from './ViewSettingsForm';

interface ModalManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal(props: ModalManagerProps) {
  const { isOpen, onClose } = props;
  return (
    <ModalWrapper title='Ontime Settings' isOpen={isOpen} onClose={onClose}>
      <ModalBody>
        <Tabs variant='ontime' size='sm' isLazy>
          <TabList>
            <Tab>App</Tab>
            <Tab>Event Data</Tab>
            <Tab>Editor</Tab>
            <Tab>Cuesheet</Tab>
            <Tab>Views</Tab>
            <Tab>URL Aliases</Tab>
            <Tab>Sync</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <AppSettingsModal />
            </TabPanel>
            <TabPanel>
              <EventDataForm />
            </TabPanel>
            <TabPanel>
              <EditorSettings />
            </TabPanel>
            <TabPanel>
              <CuesheetSettingsForm />
            </TabPanel>
            <TabPanel>
              <ViewSettingsForm />
            </TabPanel>
            <TabPanel>
              <AliasesForm />
            </TabPanel>
            <TabPanel>
              <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
                <SyncForm />
              </GoogleOAuthProvider>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </ModalBody>
    </ModalWrapper>
  );
}
