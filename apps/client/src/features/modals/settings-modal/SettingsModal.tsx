import { ModalBody, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';

import ModalWrapper from '../ModalWrapper';

import AliasesModal from './AliasesModal';
import AppSettingsModal from './AppSettings';
import EventSettingsModal from './EventSettingsModal';
import TableOptionsModal from './TableOptionsModal';
import ViewsSettingsModal from './ViewsSettingsModal';

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
            <Tab>App Settings</Tab>
            <Tab>Views</Tab>
            <Tab>Event Data</Tab>
            <Tab>URL Aliases</Tab>
            <Tab>Cuesheet</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <AppSettingsModal />
            </TabPanel>
            <TabPanel>
              <ViewsSettingsModal />
            </TabPanel>
            <TabPanel>
              <EventSettingsModal />
            </TabPanel>
            <TabPanel>
              <AliasesModal />
            </TabPanel>
            <TabPanel>
              <TableOptionsModal />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </ModalBody>
    </ModalWrapper>
  );
}
