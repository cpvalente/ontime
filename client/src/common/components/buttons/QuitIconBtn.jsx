import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Button, IconButton } from '@chakra-ui/button';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
} from '@chakra-ui/modal';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiPower } from '@react-icons/all-files/fi/FiPower';
import PropTypes from 'prop-types';
import { LoggingContext } from '../../../app/context/LoggingContext';

export default function QuitIconBtn(props) {
  const { clickHandler, size = 'lg', ...rest } = props;
  const [isOpen, setIsOpen] = useState(false);
  const { emitInfo } = useContext(LoggingContext);
  const onClose = () => setIsOpen(false);
  const cancelRef = useRef();

  useEffect(() => {
    if (window.process?.type === 'renderer') {
      window.ipcRenderer.on('user-request-shutdown', () => {
        emitInfo('Shutdown request')
        setIsOpen(true);
      });
    }
  }, [emitInfo]);

  const handleShutdown = useCallback(() => {
    onClose();
    clickHandler();
  }, [clickHandler]);

  return (
    <>
      <Tooltip label='Quit Application'>
        <IconButton
          size={size}
          icon={<FiPower />}
          colorScheme='red'
          variant='outline'
          isRound
          onClick={() => setIsOpen(true)}
          _focus={{ boxShadow: 'none' }}
          {...rest}
        />
      </Tooltip>
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize='lg' fontWeight='bold'>
              Server Shutdown
            </AlertDialogHeader>
            <AlertDialogBody>
              This will shutdown the program and all running servers. Are you sure?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme='red' onClick={handleShutdown} ml={3}>
                Shutdown
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}

QuitIconBtn.propTypes = {
  clickHandler: PropTypes.func,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
};
