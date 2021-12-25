import { ModalBody } from '@chakra-ui/modal';
import {
  FormLabel,
  FormControl,
  Input,
  Button,
  Switch,
} from '@chakra-ui/react';
import {
  getInfo,
  httpPlaceholder,
  ontimeVars,
  postInfo,
} from 'app/api/ontimeApi';
import { useContext, useEffect, useState } from 'react';
import { useFetch } from 'app/hooks/useFetch';
import { APP_TABLE } from 'app/api/apiConstants';
import style from './Modals.module.scss';
import { LoggingContext } from '../../app/context/LoggingContext';

export default function IntegrationSettingsModal() {
  const { data, status } = useFetch(APP_TABLE, getInfo);
  const { emitError } = useContext(LoggingContext);
  const [formData, setFormData] = useState(httpPlaceholder);
  const [changed, setChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const ready = status === 'success';
  const integrationInputProps = {
    size: 'sm',
    autoComplete: 'off',
    isDisabled: submitting || !ready,
  };

  useEffect(() => {
    if (data == null) return;

    setFormData({
      onLoad: data?.onLoad,
      onStart: data?.onStart,
      onUpdate: data?.onUpdate,
      onPause: data?.onPause,
      onStop: data?.onStop,
    });
  }, [data]);

  const submitHandler = async (event) => {
    event.preventDefault();

    const f = formData;
    let e = { status: false, message: '' };

    // set fields with error
    if (e.status) {
      emitError(`Invalid Input: ${e.message}`);
      return;
    }

    // Post here
    postInfo(f);

    setChanged(false);
    setSubmitting(false);
  };

  return (
    <>
      <form onSubmit={submitHandler}>
        <ModalBody
          className={ready ? style.modalBody : style.modalBodyDisabled}
        >
          <>
            <p className={style.notes}>
              Integrate with third party over an HTTP API
              <br />
              🔥 Changes take effect after app restart 🔥
            </p>
            <div className={style.highNotes}>
              <p>
                Add HTTP messages that ontime will send during the app lifecycle
              </p>
              <p>
                You can use the variables below to pass data directly from
                ontime eg:
                <span className={style.emNote}>
                  http://127.0.0.1:8088/API/?setHeadline=<b>$title</b>
                  &setSub=<b>$presenter</b>
                </span>
              </p>

              <table>
                {ontimeVars.map((v) => (
                  <tr>
                    <td className={style.noteItem}>{v.name}</td>
                    <td>{v.description}</td>
                  </tr>
                ))}
              </table>
            </div>

            <>
              <FormLabel>
                On Load
                <span className={style.notes}>When a new event loads</span>
              </FormLabel>
              <FormControl id='onLoad' className={style.modalInline}>
                <Input
                  {...integrationInputProps}
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
              </FormControl>
              <FormLabel>
                On Start
                <span className={style.notes}>
                  When an timer starts / resumes
                </span>
              </FormLabel>
              <FormControl id='onStart' className={style.modalInline}>
                <Input
                  {...integrationInputProps}
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
              </FormControl>
              <FormLabel>
                On Update
                <span className={style.notes}>At every clock tick</span>
              </FormLabel>
              <FormControl id='onUpdate' className={style.modalInline}>
                <Input
                  {...integrationInputProps}
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
              <FormLabel>
                On Pause
                <span className={style.notes}>When a timer pauses</span>
              </FormLabel>
              <FormControl id='onPause' className={style.modalInline}>
                <Input
                  {...integrationInputProps}
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
              <FormLabel>
                On Stop
                <span className={style.notes}>When an event is unloaded</span>
              </FormLabel>
              <FormControl id='onStop' className={style.modalInline}>
                <Input
                  {...integrationInputProps}
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
              <FormLabel>
                On Finish
                <span className={style.notes}>When an event is finished</span>
              </FormLabel>
              <FormControl id='onFinish' className={style.modalInline}>
                <Input
                  {...integrationInputProps}
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
            </>
          </>
          <div className={style.submitContainer}>
            <Button
              colorScheme='blue'
              type='submit'
              isLoading={submitting}
              disabled={!changed || !ready}
            >
              Save
            </Button>
          </div>
        </ModalBody>
      </form>
    </>
  );
}
