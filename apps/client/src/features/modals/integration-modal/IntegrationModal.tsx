import { ModalBody, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';

import ModalWrapper from '../ModalWrapper';

import HttpIntegration from './http/HttpIntegration';
import OscIntegration from './osc/OscIntegration';
import OscSettings from './osc/OscSettings';

import styles from '../Modal.module.scss';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const oscDocsUrl = 'https://ontime.gitbook.io/v2/control-and-feedback/integrations';

export default function IntegrationModal(props: IntegrationModalProps) {
  const { isOpen, onClose } = props;

  return (
    <ModalWrapper title='Integration Settings' isOpen={isOpen} onClose={onClose}>
      <ModalBody>
        <div className={styles.headerNotes}>
          Manage settings related to protocol integrations
          <a href={oscDocsUrl} target='_blank' rel='noreferrer'>
            Read the docs
          </a>
        </div>
        <Tabs variant='ontime' size='sm' isLazy>
          <TabList>
            <Tab>OSC</Tab>
            <Tab>OSC Integration</Tab>
            <Tab>HTTP Integration</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <OscSettings />
            </TabPanel>
            <TabPanel>
              <OscIntegration />
            </TabPanel>
            <TabPanel>
              <HttpIntegration />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </ModalBody>
    </ModalWrapper>
  );
}
