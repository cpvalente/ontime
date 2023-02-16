import { useCallback, useContext, useEffect, useState } from 'react';
import { FormLabel, Input, ModalBody, Textarea } from '@chakra-ui/react';

import { postEvent } from '../../common/api/eventApi';
import { LoggingContext } from '../../common/context/LoggingContext';
import useEvent from '../../common/hooks-query/useEvent';
import { eventDataPlaceholder } from '../../common/models/EventData.type';

import { inputProps } from './modalHelper';
import SubmitContainer from './SubmitContainer';

import style from './Modals.module.scss';

export default function SettingsModal() {
  const { data, status, refetch } = useEvent();
  const { emitError } = useContext(LoggingContext);
  const [formData, setFormData] = useState(eventDataPlaceholder);
  const [changed, setChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Set formdata from server state
   */
  useEffect(() => {
    if (data == null) return;
    if (changed) return;

    setFormData({
      title: data.title,
      publicUrl: data.publicUrl,
      publicInfo: data.publicInfo,
      backstageUrl: data.backstageUrl,
      backstageInfo: data.backstageInfo,
      endMessage: data.endMessage,
    });
  }, [changed, data]);

  /**
   * Validate and submit data
   */
  const submitHandler = useCallback(
    async (event) => {
      event.preventDefault();
      setSubmitting(true);

      try {
        await postEvent(formData);
      } catch (error) {
        emitError(`Error saving event settings: ${error}`);
      } finally {
        await refetch();
        setChanged(false);
      }

      setSubmitting(false);
    },
    [emitError, formData, refetch],
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
   * @param {string} value - new object parameter value
   */
  const handleChange = useCallback(
    (field, value) => {
      const temp = { ...formData };
      temp[field] = value;
      setFormData(temp);
      setChanged(true);
    },
    [formData],
  );

  return (
    <ModalBody className={style.modalBody}>
      <p className={style.notes}>
        Options related to the running event
        <br />
        Affects rendered views
      </p>
      <form onSubmit={submitHandler}>
        <div className={style.modalFields}>
          <div className={style.hSeparator}>Event Data</div>
          <div className={style.spacedEntry}>
            <FormLabel htmlFor='title'>Event Title</FormLabel>
            <Input
              {...inputProps}
              maxLength={35}
              name='title'
              placeholder='Event Title'
              value={formData.title}
              onChange={(event) => handleChange('title', event.target.value)}
            />
          </div>
          <div className={style.hSeparator}>Additional Screen Info</div>
          <div className={style.spacedEntry}>
            <FormLabel htmlFor='pubUrl'>
              Public URL
              <span className={style.labelNote}>
                <br />
                QR code to be shown on public screens
              </span>
            </FormLabel>
            <Input
              {...inputProps}
              name='pubUrl'
              placeholder='www.onsite.no'
              value={formData.publicUrl}
              onChange={(event) => handleChange('publicUrl', event.target.value)}
            />
          </div>
          <div className={style.spacedEntry}>
            <FormLabel htmlFor='pubInfo'>
              Public Info
              <span className={style.labelNote}>
                <br />
                Information to be shown on public screens
              </span>
            </FormLabel>
            <Textarea
              {...inputProps}
              name='pubInfo'
              placeholder='Information to be shown on public screens'
              value={formData.publicInfo}
              onChange={(event) => handleChange('publicInfo', event.target.value)}
            />
          </div>
          <div className={style.spacedEntry}>
            <FormLabel htmlFor='backstagekUrl'>
              Backstage URL
              <span className={style.labelNote}>
                <br />
                QR to be shown on backstage screens
              </span>
            </FormLabel>
            <Input
              {...inputProps}
              name='backstageUrl'
              placeholder='www.onsite.no'
              value={formData.backstageUrl}
              onChange={(event) => handleChange('backstageUrl', event.target.value)}
            />
          </div>
          <div className={style.spacedEntry}>
            <FormLabel htmlFor='backstageInfo'>
              Backstage Info
              <span className={style.labelNote}>
                <br />
                Information to be shown on backstage screens
              </span>
            </FormLabel>
            <Textarea
              {...inputProps}
              name='backstageInfo'
              placeholder='Information to be shown on backstage screens'
              resize={false}
              value={formData.backstageInfo}
              onChange={(event) => handleChange('backstageInfo', event.target.value)}
            />
          </div>
          <div className={style.spacedEntry}>
            <FormLabel htmlFor='endMessage'>
              End Message
              <span className={style.labelNote}>
                <br />
                Shown on presenter view when time is finished
              </span>
            </FormLabel>
            <Input
              {...inputProps}
              maxLength={30}
              name='endMessage'
              placeholder='Empty message shows elapsed time'
              value={formData.endMessage}
              onChange={(event) => handleChange('endMessage', event.target.value)}
            />
          </div>
        </div>
        <SubmitContainer revert={revert} submitting={submitting} changed={changed} status={status} />
      </form>
    </ModalBody>
  );
}
