import { ModalBody } from '@chakra-ui/modal';
import { FormLabel, FormControl, Input, Button, PinInput, PinInputField } from '@chakra-ui/react';
import { getOSC, oscPlaceholderSettings } from 'app/api/ontimeApi';
import { useContext, useEffect, useState } from 'react';
import { useFetch } from 'app/hooks/useFetch';
import { OSC_SETTINGS } from 'app/api/apiConstants';
import style from './Modals.module.scss';
import { LoggingContext } from '../../app/context/LoggingContext';
import { IconButton } from '@chakra-ui/button';
import { FiEye } from 'react-icons/fi';

export default function AppSettingsModal() {
  const { data, status } = useFetch(OSC_SETTINGS, getOSC);
  const { emitError } = useContext(LoggingContext);
  const [formData, setFormData] = useState(oscPlaceholderSettings);
  const [changed, setChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hidePin, setHidePin] = useState(true);

  useEffect(() => {
    if (data == null) return;
    setFormData({ ...data });
  }, [data]);

  const submitHandler = async (event) => {
    event.preventDefault();

    const f = formData;
    let e = { status: false, message: '' };

    // Validate fields
    if (f.pinCode) {
      if (f.pinCode === '') {
        e.status = true;
        e.message += 'App pincode removed';
      } else {
        e.status = true;
        e.message += 'App pincode added';
      }

    }

    // set fields with error
    if (e.status) {
      emitError(`Invalid Input: ${e.message}`);
      return;
    }

    // Post here
    // postOSC(formData);

    setChanged(false);
    setSubmitting(false);
  };

  const disableModal = status !== 'success';

  return (
    <ModalBody className={style.modalBody}>
      <p className={style.notes}>
        Options related to the application<br />
        🔥 Changes take effect after app restart 🔥
      </p>
      <form onSubmit={submitHandler}>
        <div className={style.modalFields}>
          <div className={style.hSeparator}>General App Settings</div>
          <div className={style.modalInline}>
            <FormControl id='serverPort'>
              <FormLabel htmlFor='serverPort'>
                Viewer Port
                <span className={style.notes}><br />Ontime is available at port</span>
              </FormLabel>
              <Input
                size='sm'
                name='title'
                autoComplete='off'
                value={4001}
                disabled
                style={{ width: '6em', textAlign: 'center' }}
              />
            </FormControl>
            <FormControl id='editorPin'>
              <FormLabel htmlFor='editorPin'>
                Editor Pincode
                <span className={style.notes}><br />Protect the editor with a Pincode</span>
              </FormLabel>
              <div className={style.pin}>
                <PinInput
                  size='sm'
                  defaultValue=''
                  value='1234'
                  mask={hidePin}
                  isDisabled={disableModal}
                >
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                </PinInput>
                <IconButton
                  size='sm'
                  colorScheme='blue'
                  variant='ghost'
                  icon={<FiEye />}
                  aria-label='Editor Pincode'
                  onMouseDown={() => setHidePin(false)}
                  onMouseUp={() => setHidePin(true)}
                  isDisabled={disableModal}
                />
              </div>
            </FormControl>
          </div>
        </div>
        <div className={style.submitContainer}>
          <Button
            colorScheme='blue'
            type='submit'
            isLoading={submitting}
            disabled={!changed}
          >
            Save
          </Button>
        </div>
      </form>
    </ModalBody>
  )
    ;
}
