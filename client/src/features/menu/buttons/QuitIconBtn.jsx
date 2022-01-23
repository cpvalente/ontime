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
import { useRef, useState } from 'react';
import { FiPower } from '@react-icons/all-files/fi/FiPower';

export default function QuitIconBtn(props) {
  const { clickhandler, ...rest } = props;
  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => setIsOpen(false);
  const cancelRef = useRef();

  const handleShutdown = () => {
    onClose();
    clickhandler();
  };

  return (
    <>
      <Tooltip label='Quit Application'>
        <IconButton
          size={props.size || 'xs'}
          icon={<FiPower />}
          colorScheme='red'
          variant='outline'
          isRound
          onClick={() => setIsOpen(true)}
          _focus={{ boxShadow: 'none' }}
          {...rest}
        />
      </Tooltip>
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize='lg' fontWeight='bold'>
              Server Shutdown
            </AlertDialogHeader>

            <AlertDialogBody>
              This will shutdown the program and all running servers. Are you
              sure?
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
