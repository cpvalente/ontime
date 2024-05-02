import { useState } from 'react';
import {
  Button,
  Input,
  InputGroup,
  InputLeftAddon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from '@chakra-ui/react';

import { setClientRemote } from '../../../../common/hooks/useSocket';
import { useClientStore } from '../../../../common/stores/clientStore';
import * as Panel from '../PanelUtils';

import style from './ClientControlPanel.module.scss';

export default function ClientList() {
  const { myName, clients } = useClientStore();
  console.log(clients);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { setIdentify } = setClientRemote;

  const [redirectName, setRedirectName] = useState('');

  const openRedirect = (clientName: string) => {
    setRedirectName(clientName);
    onOpen();
  };

  const redirect = (_path: string) => {
    // setClientRedirect(redirectName, path);
    onClose();
  };

  return (
    <Panel.Table>
      <RedirectModal onClose={onClose} isOpen={isOpen} clientName={redirectName} onSubmit={redirect} />
      <thead>
        <tr>
          <td className={style.fullWidth}>Client Name</td>
          <td />
        </tr>
      </thead>
      <tbody>
        {Object.entries(clients).map(([name, client]) => {
          const { identify } = client;
          const isCurrent = name === myName;
          return (
            <tr key={name} className={isCurrent ? style.current : undefined}>
              <td className={style.fullWidth}>{isCurrent ? `${name} (self)` : name}</td>
              <td className={style.actionButtons}>
                <Button
                  size='xs'
                  className={`${identify ? style.blink : ''}`}
                  variant={identify ? 'ontime-filled' : 'ontime-subtle'}
                  onClick={() => {
                    setIdentify({ target: name, state: !identify });
                  }}
                  isActive
                >
                  Identify
                </Button>
                <Button size='xs' variant='ontime-subtle'>
                  Rename
                </Button>
                <Button size='xs' variant='ontime-subtle' isDisabled={isCurrent} onClick={() => openRedirect(name)}>
                  Redirect
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Panel.Table>
  );
}

function RedirectModal(props: {
  onClose: () => void;
  isOpen: boolean;
  clientName: string;
  onSubmit: (path: string) => void;
}) {
  const { onClose, isOpen, clientName, onSubmit } = props;
  const [path, setPath] = useState('');

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant='ontime'>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Redirect Client</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <div>Redirect {clientName} to a new URL</div>
          <InputGroup variant='ontime-filled' size='md'>
            {/* TODO: better description */}
            <InputLeftAddon>ontime:port/</InputLeftAddon>
            <Input placeholder='newpath?and=params' value={path} onChange={(event) => setPath(event.target.value)} />
          </InputGroup>
        </ModalBody>
        <ModalFooter>
          <div className={style.buttonSection}>
            <Button size='md' variant='ontime-subtle' onClick={onClose}>
              Cancel
            </Button>
            <Button size='md' variant='ontime-filled' onClick={() => onSubmit(path)}>
              Submit
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
