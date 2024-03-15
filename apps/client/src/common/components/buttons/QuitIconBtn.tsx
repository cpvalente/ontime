import { useCallback, useEffect } from 'react';
import { ActionIcon, Button, Group, Modal, Space, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { IoPowerOutline } from '@react-icons/all-files/io5/IoPowerOutline';

import { useEmitLog } from '../../stores/logger';

interface QuitIconBtnProps {
  clickHandler: () => void;
  disabled?: boolean;
}

export default function QuitIconBtn(props: QuitIconBtnProps) {
  const { clickHandler, disabled } = props;
  const [opened, { open, close }] = useDisclosure(false);
  const { emitInfo } = useEmitLog();

  useEffect(() => {
    if (window.process?.type === 'renderer') {
      window.ipcRenderer.on('user-request-shutdown', () => {
        emitInfo('Shutdown request');
        open();
      });
    }
  }, [emitInfo, open]);

  const handleShutdown = useCallback(() => {
    close();
    clickHandler();
  }, [clickHandler, close]);

  return (
    <>
      <Tooltip label='Quit Application'>
        <ActionIcon
          aria-label='Quit Application'
          variant='filled'
          size='lg'
          color='red'
          onClick={open}
          disabled={disabled}
        >
          <IoPowerOutline />
        </ActionIcon>
      </Tooltip>
      <Modal.Root opened={opened} onClose={close} size='auto'>
        <Modal.Overlay />
        <Modal.Content>
          <Modal.Body>
            <Group>
              This will shutdown the Ontime server.
              <br />
              Are you sure?
            </Group>
            <Space h='sm' />
            <Group justify='flex-end'>
              <Button onClick={close} variant='outline' size='sm'>
                Cancel
              </Button>
              <Button color='red' onClick={handleShutdown} size='sm'>
                Shutdown
              </Button>
            </Group>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
    </>
  );
}
