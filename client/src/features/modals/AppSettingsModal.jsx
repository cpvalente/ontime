import { ModalBody } from '@chakra-ui/modal';
import { FormLabel, FormControl, Input, Button } from '@chakra-ui/react';
import { getInfo, ontimePlaceholderInfo, postInfo } from 'app/api/ontimeApi';
import { useEffect, useState } from 'react';
import { useFetch } from 'app/hooks/useFetch';
import { APP_TABLE } from 'app/api/apiConstants';
import { showErrorToast } from 'common/helpers/toastManager';
import style from './Modals.module.scss';

export default function AppSettingsModal() {
  const { data, status } = useFetch(APP_TABLE, getInfo);
  const [formData, setFormData] = useState(ontimePlaceholderInfo);
  const [changed, setChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (data == null) return;

    setFormData({
      oscInPort: data.oscInPort,
      oscOutPort: data.oscOutPort,
      oscOutIP: data.oscOutIP,
    });
  }, [data]);

  const submitHandler = async (event) => {
    event.preventDefault();

    const f = formData;
    let e = { status: false, message: '' };

    // Validate fields
    if (f.oscInPort < 1024 || f.oscInPort > 65535) {
      // Port in incorrect range
      e.status = true;
      e.message += 'OSC IN Port in incorrect range (1024 - 65535)';
    } else if (f.oscOutPort < 1024 || f.oscOutPort > 65535) {
      // Port in incorrect range
      e.status = true;
      e.message += 'OSC OUT Port in incorrect range (1024 - 65535)';
    } else if (f.oscInPort === f.oscOutPort) {
      // Cant use the same port
      e.status = true;
      e.message += 'OSC IN and OUT Ports cant be the same';
    }

    // set fields with error
    if (e.status) {
      showErrorToast('Invalid Input', e.message);
      return;
    }

    // Post here
    postInfo(formData);

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
              <FormControl id='oscInPort'>
                <FormLabel htmlFor='oscInPort'>
                  OSC In Port
                  <span className={style.notes}>
                    <br />
                    App Control - Default 8888
                  </span>
                </FormLabel>
                <Input
                  size='sm'
                  name='oscInPort'
                  placeholder='8888'
                  autoComplete='off'
                  type='number'
                  value={formData.oscInPort}
                  min='1024'
                  max='65535'
                  onChange={(event) => {
                    setChanged(true);
                    setFormData({
                      ...formData,
                      oscInPort: parseInt(event.target.value),
                    });
                  }}
                  isDisabled={submitting}
                  style={{ width: '6em', textAlign: 'center' }}
                />
              </FormControl>
              <div className={style.modalInline}>
                <FormControl id='oscOutIP' width='auto'>
                  <FormLabel htmlFor='oscOutIP'>
                    OSC Out Target IP
                    <span className={style.notes}>
                      <br />
                      App Feedback - Default 127.0.0.1
                    </span>
                  </FormLabel>
                  <Input
                    size='sm'
                    name='oscOutIP'
                    placeholder='127.0.0.1'
                    autoComplete='off'
                    value={formData.oscOutIP}
                    onChange={(event) => {
                      setChanged(true);
                      setFormData({
                        ...formData,
                        oscOutIP: event.target.value,
                      });
                    }}
                    isDisabled={submitting}
                    style={{ width: '12em', textAlign: 'right' }}
                  />
                </FormControl>
                <FormControl id='oscOutPort' width='auto'>
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
                    type='number'
                    value={formData.oscOutPort}
                    min='1024'
                    max='65535'
                    onChange={(event) => {
                      setChanged(true);
                      setFormData({
                        ...formData,
                        oscOutPort: parseInt(event.target.value),
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
