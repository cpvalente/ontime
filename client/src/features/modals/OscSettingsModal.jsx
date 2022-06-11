import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ModalBody } from '@chakra-ui/modal';
import { FormControl, FormLabel, Input } from '@chakra-ui/react';
import { IoInformationCircleOutline } from '@react-icons/all-files/io5/IoInformationCircleOutline';
import { OSC_SETTINGS } from 'app/api/apiConstants';
import { getOSC, oscPlaceholderSettings, postOSC } from 'app/api/ontimeApi';
import { useFetch } from 'app/hooks/useFetch';

import { LoggingContext } from '../../app/context/LoggingContext';
import EnableBtn from '../../common/components/buttons/EnableBtn';

import { inputProps, portInputProps } from './modalHelper';
import SubmitContainer from './SubmitContainer';

import style from './Modals.module.scss';

// currently defined endpoints
// temporary
const oscCycleEndpoints = [
  {
    title: 'On Event Start',
    message: '/ontime/eventNumber',
    value: '8 | int',
  },
  {
    title: 'On Update',
    message: '/ontime/time',
    value: '10:12:12 | string',
  },
  {
    title: 'On Update',
    message: '/ontime/overtime',
    value: '0-1 | int',
  },
  {
    title: 'On Update',
    message: '/ontime/title',
    value: 'Title of running event | string',
  },
  {
    title: 'On Finish',
    message: '/ontime/finished',
    value: '-',
  },
];
const oscTriggerEndpoints = [
  {
    title: 'On Start',
    message: '/ontime/play',
    value: '-',
  },
  {
    title: 'On Pause',
    message: '/ontime/pause',
    value: '-',
  },
  {
    title: 'On Previous',
    message: '/ontime/prev',
    value: '-',
  },
  {
    title: 'On Next',
    message: '/ontime/next',
    value: '-',
  },
  {
    title: 'On Reload',
    message: '/ontime/reload',
    value: '-',
  },
  {
    title: 'On Stop',
    message: '/ontime/stop',
    value: '-',
  },
];

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
  const submitHandler = useCallback(
    async (event) => {
      event.preventDefault();
      setSubmitting(true);

      const f = formData;
      const e = { status: false, message: '' };

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
        await refetch();
        setChanged(false);
      }
      setSubmitting(false);
    },
    [emitError, formData, refetch]
  );

  /**
   * Reverts local state equals to server state
   */
  const revert = useCallback(async () => {
    setChanged(false);
    await refetch();
  }, [refetch]);

  /**
   * Handles change of input field in local state
   * @param {string} field - object parameter to update
   * @param {(string | number | boolean)} value - new object parameter value
   */
  const handleChange = useCallback(
    (field, value) => {
      const temp = { ...formData };
      temp[field] = value;
      setFormData(temp);
      setChanged(true);
    },
    [formData]
  );

  return (
    <ModalBody className={style.modalBody}>
      <p className={style.notes}>
        Options related to Open Sound Control
        <br />
        🔥 Changes take effect after app restart 🔥
      </p>
      <form onSubmit={submitHandler}>
        <div className={style.modalFields}>
          <div className={style.hSeparator}>OSC Input (Control ontime over OSC)</div>
          <div className={style.modalInline}>
            <FormControl id='oscInEnabled'>
              <FormLabel htmlFor='oscInEnabled'>
                OSC Enable
                <span className={style.labelNote}>
                  <br />
                  Enable / Disable control
                </span>
              </FormLabel>
              <EnableBtn
                active={formData.enabled}
                text={formData.enabled ? 'OSC IN Enabled' : 'OSC IN Disabled'}
                actionHandler={() => handleChange('enabled', !formData.enabled)}
              />
            </FormControl>
            <FormControl id='portIn'>
              <FormLabel htmlFor='portIn'>
                OSC In Port
                <span className={style.labelNote}>
                  <br />
                  Port - Default 8888
                </span>
              </FormLabel>
              <Input
                {...portInputProps}
                name='port'
                placeholder='8888'
                value={formData.port}
                onChange={(event) => handleChange('port', parseInt(event.target.value, 10))}
                style={{ width: '6em', textAlign: 'center' }}
              />
            </FormControl>
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
                onChange={(event) => handleChange('targetIP', event.target.value)}
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
                onChange={(event) => handleChange('portOut', parseInt(event.target.value, 10))}
                style={{ width: '6em', textAlign: 'left' }}
              />
            </FormControl>
          </div>
          <div className={style.blockNotes}>
            <span className={style.inlineFlex}>
              <IoInformationCircleOutline color='#2b6cb0' fontSize='2em' />
              OSC Feedback messages
            </span>
            <span>
              In future OSC feedback will be user defined. <br />
              For now this is the list of OSC messages sent from ontime
            </span>
            <table>
              <tbody>
                <tr>
                  <td className={style.labelNote} style={{ width: '30%' }}>
                    Cycle
                  </td>
                  <td className={style.labelNote}>Message</td>
                  <td className={style.labelNote}>Value (example | type)</td>
                </tr>
                {oscCycleEndpoints.map((e) => (
                  <tr key={e.message}>
                    <td>{e.title}</td>
                    <td>{e.message}</td>
                    <td>{e.value}</td>
                  </tr>
                ))}
                <tr>
                  <td className={style.labelNote} style={{ width: '30%' }}>
                    Trigger
                  </td>
                  <td className={style.labelNote}>Message</td>
                  <td className={style.labelNote}>Value (example | type)</td>
                </tr>
                {oscTriggerEndpoints.map((e) => (
                  <tr key={e.message}>
                    <td>{e.title}</td>
                    <td>{e.message}</td>
                    <td>{e.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
