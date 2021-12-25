import { ModalBody } from '@chakra-ui/modal';
import { FormLabel, FormControl, Input, Button } from '@chakra-ui/react';
import { getOSC, oscPlaceholderSettings, postOSC } from 'app/api/ontimeApi';
import { useContext, useEffect, useState } from 'react';
import { useFetch } from 'app/hooks/useFetch';
import { OSC_SETTINGS } from 'app/api/apiConstants';
import style from './Modals.module.scss';
import { LoggingContext } from '../../app/context/LoggingContext';

export default function AppSettingsModal() {
  const { data, status } = useFetch(OSC_SETTINGS, getOSC);
  const { emitError } = useContext(LoggingContext);
  const [formData, setFormData] = useState(oscPlaceholderSettings);
  const [changed, setChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (data == null) return;
    setFormData({ ...data });
  }, [data]);

  const submitHandler = async (event) => {
    event.preventDefault();

    const f = formData;
    let e = { status: false, message: '' };

    // Validate fields
    if (f.port < 1024 || f.port > 65535) {
      // Port in incorrect range
      e.status = true;
      e.message += 'OSC IN Port in incorrect range (1024 - 65535)';
    } else if (f.portOut < 1024 || f.portOut > 65535) {
      // Port in incorrect range
      e.status = true;
      e.message += 'OSC OUT Port in incorrect range (1024 - 65535)';
    } else if (f.port === f.portOut) {
      // Cant use the same port
      e.status = true;
      e.message += 'OSC IN and OUT Ports cant be the same';
    }

    // set fields with error
    if (e.status) {
      emitError(`Invalid Input: ${e.message}`);
      return;
    }

    // Post here
    postOSC(formData);

    setChanged(false);
    setSubmitting(false);
  };

  return (
    <>
      <form onSubmit={submitHandler}>
        <ModalBody className={style.modalBody}>
          {status === 'success' && (
            <>
              <p className={style.notes}>
                Options related to the application
                <br />
                🔥 Changes take effect after app restart 🔥
              </p>

              <FormControl id='serverPort'>
                <FormLabel htmlFor='serverPort'>
                  Viewer Port
                  <span className={style.notes}>Port to access viewers</span>
                </FormLabel>
                <Input
                  size='sm'
                  name='title'
                  placeholder='4001'
                  autoComplete='off'
                  value={4001}
                  readOnly
                  style={{ width: '6em', textAlign: 'center' }}
                />
                <span className={style.notes}>(Read Only Value)</span>
              </FormControl>
              <FormControl id='port'>
                <FormLabel htmlFor='port'>
                  OSC In Port
                  <span className={style.notes}>
                    <br />
                    App Control - Default 8888
                  </span>
                </FormLabel>
                <Input
                  size='sm'
                  name='port'
                  placeholder='8888'
                  autoComplete='off'
                  type='number'
                  value={formData.port}
                  min='1024'
                  max='65535'
                  onChange={(event) => {
                    setChanged(true);
                    setFormData({
                      ...formData,
                      port: parseInt(event.target.value),
                    });
                  }}
                  isDisabled={submitting}
                  style={{ width: '6em', textAlign: 'center' }}
                />
              </FormControl>
              <div className={style.modalInline}>
                <FormControl id='targetIP' width='auto'>
                  <FormLabel htmlFor='targetIP'>
                    OSC Out Target IP
                    <span className={style.notes}>
                      <br />
                      App Feedback - Default 127.0.0.1
                    </span>
                  </FormLabel>
                  <Input
                    size='sm'
                    name='targetIP'
                    placeholder='127.0.0.1'
                    autoComplete='off'
                    value={formData.targetIP}
                    onChange={(event) => {
                      setChanged(true);
                      setFormData({
                        ...formData,
                        targetIP: event.target.value,
                      });
                    }}
                    isDisabled={submitting}
                    style={{ width: '12em', textAlign: 'right' }}
                  />
                </FormControl>
                <FormControl id='portOut' width='auto'>
                  <FormLabel htmlFor='portOut'>
                    OSC Out Port
                    <span className={style.notes}>
                      <br />
                      Default 9999
                    </span>
                  </FormLabel>
                  <Input
                    size='sm'
                    name='portOut'
                    placeholder='9999'
                    autoComplete='off'
                    type='number'
                    value={formData.portOut}
                    min='1024'
                    max='65535'
                    onChange={(event) => {
                      setChanged(true);
                      setFormData({
                        ...formData,
                        portOut: parseInt(event.target.value),
                      });
                    }}
                    isDisabled={submitting}
                    style={{ width: '6em', textAlign: 'left' }}
                  />
                </FormControl>
              </div>
            </>
          )}
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
        </ModalBody>
      </form>
    </>
  );
}
