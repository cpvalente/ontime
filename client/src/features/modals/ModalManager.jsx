import PropTypes from 'prop-types';
import {
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/modal';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/tabs';
import SettingsModal from './SettingsModal';

export default function ModalManager(props) {
  const { isOpen, onClose } = props;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
      motionPreset={'slideInBottom'}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Ontime Settings</ModalHeader>
        <ModalCloseButton />

        <Tabs size='sm' isLazy>
          <TabList>
            <Tab>Event Settings</Tab>
            <Tab>Application Settings</Tab>
            <Tab>URL Aliases</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <SettingsModal onClose={onClose} />
            </TabPanel>
            <TabPanel>
              <p>Application settings will be here!</p>
              <p>Set port</p>
              <p>Set end message</p>
            </TabPanel>
            <TabPanel>
              <p>You will be able to define URL aliases here!</p>
              <p>List existing aliases</p>
              <p>List existing aliases</p>
              <p>List existing aliases</p>
              <p>Add new alias input + button</p>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </ModalContent>
    </Modal>
  );
}

ModalManager.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.bool.isRequired,
};
