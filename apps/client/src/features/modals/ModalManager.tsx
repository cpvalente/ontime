import {
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react';

import AliasesModal from './AliasesModal';
import AppSettingsModal from './AppSettingsModal';
import EventSettingsModal from './EventSettingsModal';
import TableOptionsModal from './TableOptionsModal';
import ViewsSettingsModal from './ViewsSettingsModal';

interface ModalManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalManager(props: ModalManagerProps) {
  const { isOpen, onClose } = props;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
      motionPreset='slideInBottom'
      size='xl'
      scrollBehavior='inside'
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Ontime Settings</ModalHeader>
        <ModalCloseButton />

        <Tabs size='sm' isLazy>
          <TabList>
            <Tab>App Settings</Tab>
            <Tab>Viewers</Tab>
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
      </ModalContent>
    </Modal>
  );
}
