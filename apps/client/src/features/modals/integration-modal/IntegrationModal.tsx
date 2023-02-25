import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';

import ModalWrapper from '../ModalWrapper';

import OscIntegrationSettings from './OscIntegrationSettings';
import OscSettingsModal from './OscSettingsModal';

import styles from '../Modal.module.scss';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IntegrationModal(props: IntegrationModalProps) {
  const { isOpen, onClose } = props;

  return (
    <ModalWrapper title='Integration Settings' isOpen={isOpen} onClose={onClose}>
      <div className={styles.headerNotes}>
        Manage settings related to protocol integrations. <br />
        Changes take effect on app restart.
      </div>
      <Tabs variant='ontime' size='sm' isLazy>
        <TabList>
          <Tab>OSC</Tab>
          <Tab>Old OSC</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <OscIntegrationSettings />
          </TabPanel>
          <TabPanel>
            <OscSettingsModal />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </ModalWrapper>
  );
}
