import { ModalBody } from '@chakra-ui/modal';
import { FormControl, FormLabel, Input } from '@chakra-ui/react';
import { getOSC, oscPlaceholderSettings, postOSC } from 'app/api/ontimeApi';
import { useContext, useEffect, useState } from 'react';
import { useFetch } from 'app/hooks/useFetch';
import { OSC_SETTINGS } from 'app/api/apiConstants';
import style from './Modals.module.scss';
import { LoggingContext } from '../../app/context/LoggingContext';
import SubmitContainer from './SubmitContainer';
import { inputProps, portInputProps } from './modalHelper';


export default function OscSettingsModal() {
  const { data, status, refetch } = useFetch(OSC_SETTINGS, getOSC);
  const { emitError } = useContext(LoggingContext);
  const [formData, setFormData] = useState(oscPlaceholderSettings);
  const [changed, setChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Set formdata from server state
   */
  useEffect(() => {
    if (data == null) return;
    if (changed) return;
    setFormData({ ...data });
  }, [changed, data]);

  /**
   * Validate and submit data
   */
  const submitHandler = async (event) => {
    event.preventDefault();
    setSubmitting(true);

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
    } else {
      // Post here
      await postOSC(formData);
      setChanged(false);
    }
    setSubmitting(false);
  };

  /**
   * Reverts local state equals to server state
   */
  const revert = async () => {
    setChanged(false);
    await refetch();
  };

  /**
   * Handles change of input field in local state
   * @param {string} field - object parameter to update
   * @param {(string | number)} value - new object parameter value
   */
  const handleChange = (field, value) => {
    const temp = { ...formData };
    temp[field] = value;
    setFormData(temp);
    setChanged(true);
  };

  return (
    <ModalBody className={style.modalBody}>
      <p className={style.notes}>
        Options related to Open Sound Control
        <br />
        🔥 Changes take effect after app restart 🔥
      </p>
      <form onSubmit={submitHandler}>
        <div className={style.modalFields}>
          <div className={style.hSeparator}>OSC Input (control)</div>
          <div className={style.spacedEntry}>
            <FormLabel htmlFor='port'>
              OSC In Port
              <span className={style.labelNote}>
                <br />
                Open port for 3rd party control over OSC - Default 8888
              </span>
            </FormLabel>
            <Input
              {...portInputProps}
              name='port'
              placeholder='8888'
              value={formData.port}
              onChange={(event) =>
                handleChange('port', parseInt(event.target.value))
              }
              style={{ width: '6em', textAlign: 'center' }}
            />
          </div>
          <div className={style.hSeparator}>OSC Output (feedback)</div>
          <div className={style.modalInline}>
            <FormControl id='targetIP'>
              <FormLabel htmlFor='targetIP'>
                OSC Out Target IP
                <span className={style.labelNote}>
                  <br />
                  Default 127.0.0.1
                </span>
              </FormLabel>
              <Input
                {...inputProps}
                size='sm'
                name='targetIP'
                placeholder='127.0.0.1'
                autoComplete='off'
                value={formData.targetIP}
                onChange={(event) =>
                  handleChange('targetIP', event.target.value)
                }
                isDisabled={submitting}
                style={{ width: '12em', textAlign: 'right' }}
              />
            </FormControl>
            <FormControl id='portOut'>
              <FormLabel htmlFor='portOut'>
                OSC Out Port
                <span className={style.labelNote}>
                  <br />
                  Default 9999
                </span>
              </FormLabel>
              <Input
                {...portInputProps}
                name='portOut'
                placeholder='9999'
                value={formData.portOut}
                onChange={(event) =>
                  handleChange('portOut', parseInt(event.target.value))
                }
                style={{ width: '6em', textAlign: 'left' }}
              />
            </FormControl>
          </div>
        </div>
        <SubmitContainer
          revert={revert}
          submitting={submitting}
          changed={changed}
          status={status}
        />
      </form>
    </ModalBody>
  );
}
