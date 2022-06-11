import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ModalBody } from '@chakra-ui/modal';
import { FormControl, FormLabel, Input, Switch } from '@chakra-ui/react';
import { FiInfo } from '@react-icons/all-files/fi/FiInfo';
import { APP_TABLE } from 'app/api/apiConstants';
import { getInfo, httpPlaceholder, ontimeVars, postInfo } from 'app/api/ontimeApi';
import { useFetch } from 'app/hooks/useFetch';

import { LoggingContext } from '../../app/context/LoggingContext';

import { inputProps } from './modalHelper';
import SubmitContainer from './SubmitContainer';

import style from './Modals.module.scss';

export default function IntegrationSettingsModal() {
  const { data, status, refetch } = useFetch(APP_TABLE, getInfo);
  const { emitError } = useContext(LoggingContext);
  const [formData, setFormData] = useState(httpPlaceholder);
  const [changed, setChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Set formdata from server state
   */
  useEffect(() => {
    if (data == null) return;
    if (changed) return;

    setFormData({
      onLoad: data?.onLoad,
      onStart: data?.onStart,
      onUpdate: data?.onUpdate,
      onPause: data?.onPause,
      onStop: data?.onStop,
    });
  }, [changed, data]);

  /**
   * Validate and submit data
   */
  const submitHandler = useCallback(
    async (event) => {
      event.preventDefault();

      const f = formData;
      const e = { status: false, message: '' };

      // set fields with error
      if (e.status) {
        emitError(`Invalid Input: ${e.message}`);
      } else {
        await postInfo(f);
        setChanged(false);
        setSubmitting(false);
      }
    },
    [emitError, formData]
  );

  /**
   * Reverts local state equals to server state
   */
  const revert = useCallback(async () => {
    setChanged(false);
    await refetch();
  }, [refetch]);

  // Todo: make change handler
  // Todo: toggle between GET / POST
  // Todo: add test button
  // Todo: enabled should be button
  // Todo: add friendly placeholder to input

  return (
    <ModalBody className={style.modalBody}>
      <p className={style.notes}>
        Integrate with third party over an HTTP API
        <br />
        🔥 Changes take effect after app restart 🔥
      </p>
      <form onSubmit={submitHandler}>
        <div className={style.modalFields}>
          <div className={style.hSeparator}>Ontime event cycle</div>
          <div className={style.blockNotes}>
            <span className={style.inlineFlex}>
              <FiInfo color='#2b6cb0' fontSize='2em' />
              Add HTTP messages that ontime will send during the event cycle
            </span>
            <span className={style.labelNote}>
              You can use variables in the HTTP request URL to send data from ontime
            </span>
            <span className={style.emNote}>
              http://127.0.0.1:8088/API/?setHeadline=
              <span className={style.labelNoteInline}>$title</span>
              &setSub=<span className={style.labelNoteInline}>$presenter</span>
            </span>
            <table>
              <tbody>
                <tr>
                  <td className={style.labelNote} style={{ width: '30%' }}>
                    Variable
                  </td>
                  <td className={style.labelNote}>Value</td>
                </tr>
                {ontimeVars.map((v) => (
                  <tr key={v.name}>
                    <td className={style.labelNote}>{v.name}</td>
                    <td>{v.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={style.hSeparator}>Send HTTP</div>
          <FormLabel style={{ paddingLeft: '0.5em' }}>
            On Load
            <span className={style.labelNote}>
              <br />
              When a new event loads
            </span>
          </FormLabel>
          <div className={style.modalInline}>
            <Input
              {...inputProps}
              name='onLoadURL'
              value={formData?.onLoad?.url}
              onChange={(event) => {
                setChanged(true);
                setFormData({
                  ...formData,
                  onLoad: {
                    ...formData.onLoad,
                    url: event.target.value,
                  },
                });
              }}
            />
            <Switch
              colorScheme='green'
              id='onLoadEnable'
              value={formData?.onLoad?.enabled}
              onChange={(event) => {
                setChanged(true);
                setFormData({
                  ...formData,
                  onLoad: {
                    ...formData.onLoad,
                    enabled: event.target.value,
                  },
                });
              }}
            />
          </div>
          <FormLabel style={{ paddingLeft: '0.5em' }}>
            On Start
            <span className={style.labelNote}>
              <br />
              When an timer starts / resumes{' '}
            </span>
          </FormLabel>
          <div className={style.modalInline}>
            <Input
              {...inputProps}
              name='onStartURL'
              value={formData?.onStart?.url}
              onChange={(event) => {
                setChanged(true);
                setFormData({
                  ...formData,
                  onStart: {
                    ...formData.onStart,
                    url: event.target.value,
                  },
                });
              }}
            />
            <Switch
              colorScheme='green'
              id='onStartEnable'
              value={formData?.onStart?.enabled}
              onChange={(event) => {
                setChanged(true);
                setFormData({
                  ...formData,
                  onStart: {
                    ...formData.onStart,
                    enabled: event.target.value,
                  },
                });
              }}
            />
          </div>
          <FormLabel style={{ paddingLeft: '0.5em' }}>
            On Update
            <span className={style.labelNote}>
              <br />
              At every clock tick
            </span>
          </FormLabel>
          <FormControl id='onUpdate' className={style.modalInline}>
            <Input
              {...inputProps}
              name='onUpdateURL'
              value={formData?.onUpdate?.url}
              onChange={(event) => {
                setChanged(true);
                setFormData({
                  ...formData,
                  onUpdate: {
                    ...formData.onUpdate,
                    url: event.target.value,
                  },
                });
              }}
            />
            <Switch
              colorScheme='green'
              id='onUpdateEnable'
              value={formData?.onUpdate?.enabled}
              onChange={(event) => {
                setChanged(true);
                setFormData({
                  ...formData,
                  onUpdate: {
                    ...formData.onUpdate,
                    enabled: event.target.value,
                  },
                });
              }}
            />
          </FormControl>
          <FormLabel style={{ paddingLeft: '0.5em' }}>
            On Pause
            <span className={style.labelNote}>
              <br />
              When a timer pauses
            </span>
          </FormLabel>
          <FormControl id='onPause' className={style.modalInline}>
            <Input
              {...inputProps}
              name='onPauseURL'
              value={formData?.onPause?.url}
              onChange={(event) => {
                setChanged(true);
                setFormData({
                  ...formData,
                  onPause: {
                    ...formData.onPause,
                    url: event.target.value,
                  },
                });
              }}
            />
            <Switch
              colorScheme='green'
              id='onPauseEnable'
              value={formData?.onPause?.enabled}
              onChange={(event) => {
                setChanged(true);
                setFormData({
                  ...formData,
                  onPause: {
                    ...formData.onPause,
                    enabled: event.target.value,
                  },
                });
              }}
            />
          </FormControl>
          <FormLabel style={{ paddingLeft: '0.5em' }}>
            On Stop
            <span className={style.labelNote}>
              <br />
              When an event is unloaded
            </span>
          </FormLabel>
          <FormControl id='onStop' className={style.modalInline}>
            <Input
              {...inputProps}
              name='onStopURL'
              value={formData?.onStop?.url}
              onChange={(event) => {
                setChanged(true);
                setFormData({
                  ...formData,
                  onStop: {
                    ...formData.onStop,
                    url: event.target.value,
                  },
                });
              }}
            />
            <Switch
              colorScheme='green'
              id='onStopEnable'
              value={formData?.onStop?.enabled}
              onChange={(event) => {
                setChanged(true);
                setFormData({
                  ...formData,
                  onStop: {
                    ...formData.onStop,
                    enabled: event.target.value,
                  },
                });
              }}
            />
          </FormControl>
          <FormLabel style={{ paddingLeft: '0.5em' }}>
            On Finish
            <span className={style.labelNote}>
              <br />
              When an event is finished
            </span>
          </FormLabel>
          <FormControl id='onFinish' className={style.modalInline}>
            <Input
              {...inputProps}
              name='onFinishURL'
              value={formData?.onFinish?.url}
              onChange={(event) => {
                setChanged(true);
                setFormData({
                  ...formData,
                  onStop: {
                    ...formData.onFinish,
                    url: event.target.value,
                  },
                });
              }}
            />
            <Switch
              colorScheme='green'
              id='onFinishEnable'
              value={formData?.onFinish?.enabled}
              onChange={(event) => {
                setChanged(true);
                setFormData({
                  ...formData,
                  onStop: {
                    ...formData.onStop,
                    enabled: event.target.value,
                  },
                });
              }}
            />
          </FormControl>
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
