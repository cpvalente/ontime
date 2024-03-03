import { ModalBody, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';

import ModalWrapper from '../ModalWrapper';

import AliasesForm from './AliasesForm';
import ProjectDataForm from './ProjectDataForm';

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
            <Tab>Project Data</Tab>
            <Tab>URL Aliases</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <ProjectDataForm />
            </TabPanel>
            <TabPanel>
              <AliasesForm />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </ModalBody>
    </ModalWrapper>
  );
}
