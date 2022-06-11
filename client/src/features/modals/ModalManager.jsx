import React from 'react';
import {
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/modal';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/tabs';
import PropTypes from 'prop-types';

import AliasesModal from './AliasesModal';
import AppSettingsModal from './AppSettingsModal';
import EventSettingsModal from './EventSettingsModal';
import IntegrationSettingsModal from './IntegrationSettingsModal';
import OscSettingsModal from './OscSettingsModal';
import TableOptionsModal from './TableOptionsModal';

export default function ModalManager(props) {
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
            <Tab style={{ fontSize: '0.9em' }}>App Settings</Tab>
            <Tab style={{ fontSize: '0.9em' }}>Event Data</Tab>
            <Tab style={{ fontSize: '0.9em' }}>URL Aliases</Tab>
            <Tab style={{ fontSize: '0.9em' }}>Cuesheet</Tab>
            <Tab style={{ fontSize: '0.9em' }}>OSC</Tab>
            {/*<Tab style={{ fontSize: '0.9em' }}>Integration</Tab>*/}
          </TabList>
          <TabPanels>
            <TabPanel>
              <AppSettingsModal />
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
            <TabPanel>
              <OscSettingsModal />
            </TabPanel>
            {/*<TabPanel>*/}
            {/*  <IntegrationSettingsModal />*/}
            {/*</TabPanel>*/}
          </TabPanels>
        </Tabs>
      </ModalContent>
    </Modal>
  );
}

ModalManager.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
