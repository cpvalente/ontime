import { ModalBody } from '@chakra-ui/modal';
import { FormLabel, FormControl, Input, Button } from '@chakra-ui/react';
import { fetchEvent } from 'app/api/eventApi';
import { useState } from 'react';
import { useFetch } from 'app/hooks/useFetch';
import { EVENT_TABLE } from 'app/api/apiConstants';
import style from './Modals.module.css';

export default function AppSettingsModal() {
  const { data, status, isError } = useFetch(EVENT_TABLE, fetchEvent);
  const [submitting, setSubmitting] = useState(false);

  const submitHandler = async (event) => {
    event.preventDefault();
    // NOTHING HERE YET
  };

  return (
    <>
      <form onSubmit={submitHandler}>
        <ModalBody className={style.modalBody}>
          <>
            <p className={style.notes}>
              Options related to the application
              <br />
              !!! Changing of these options is not yet implemented !!!
            </p>

            <FormControl id='viewerPort'>
              <FormLabel htmlFor='viewerPort'>
                Viewer Port
                <span className={style.notes}>
                  Port to access viewers - Default 4001
                </span>
              </FormLabel>
              <Input
                size='sm'
                name='title'
                placeholder='4001'
                autoComplete='off'
                value={4001}
                onChange={(event) => {
                  // Nothing here yet
                }}
                isDisabled={true}
                style={{ width: '6em' }}
              />
            </FormControl>
            <FormControl id='oscInPort'>
              <FormLabel htmlFor='oscInPort'>
                OSC In Port
                <span className={style.notes}>
                  <br />
                  App control - Default 8888
                </span>
              </FormLabel>
              <Input
                size='sm'
                name='oscInPort'
                placeholder='8888'
                autoComplete='off'
                value={8888}
                onChange={(event) => {
                  // Nothing here yet
                }}
                isDisabled={true}
                style={{ width: '6em' }}
              />
            </FormControl>
            <div className={style.modalInline}>
              <FormControl id='oscOutTarget'>
                <FormLabel htmlFor='oscOutTarget'>
                  OSC Out Target IP
                  <span className={style.notes}>
                    <br />
                    App Feedback - Default 127.0.0.1
                  </span>
                </FormLabel>
                <Input
                  size='sm'
                  name='oscOutPort'
                  placeholder='9999'
                  autoComplete='off'
                  value={'127.0.0.1'}
                  onChange={(event) => {
                    // Nothing here yet
                  }}
                  isDisabled={true}
                />
              </FormControl>
              <FormControl id='oscOutPort'>
                <FormLabel htmlFor='oscOutPort'>
                  OSC Out Port
                  <span className={style.notes}>
                    <br />
                    Default 9999
                  </span>
                </FormLabel>
                <Input
                  size='sm'
                  name='oscOutPort'
                  placeholder='9999'
                  autoComplete='off'
                  value={9999}
                  onChange={(event) => {
                    // Nothing here yet
                  }}
                  isDisabled={true}
                  style={{ width: '6em' }}
                />
              </FormControl>
            </div>

            <FormControl id='endMessage'>
              <FormLabel htmlFor='endMessage'>
                End Message
                <span className={style.notes}>
                  Message shown in timer when time is finished
                </span>
              </FormLabel>
              <Input
                size='sm'
                name='endMessage'
                placeholder='Time Out'
                autoComplete='off'
                value={'TIME UP'}
                onChange={(event) => {
                  // Nothing here yet
                }}
                isDisabled={true}
              />
            </FormControl>
          </>
          <Button
            colorScheme='blue'
            type='submit'
            isLoading={submitting}
            disabled={true}
          >
            Save
          </Button>
        </ModalBody>
      </form>
    </>
  );
}
