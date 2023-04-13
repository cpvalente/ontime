import { useCallback, useEffect, useState } from 'react';
import { FormLabel, Input, ModalBody } from '@chakra-ui/react';

import { useEmitLog } from '@/common/stores/logger';

import { postView } from '../../common/api/ontimeApi';
import PopoverPicker from '../../common/components/input/color-picker-input/PopoverPicker';
import useViewSettings from '../../common/hooks-query/useViewSettings';
import { viewsSettingsPlaceholder } from '../../common/models/ViewSettings.type';

import { inputProps } from './modalHelper';
import SubmitContainer from './SubmitContainer';

import style from './Modals.module.scss';

export default function StyleSettingsModal() {
  const { data, status, refetch } = useViewSettings();

  const { emitError } = useEmitLog();
  const [formData, setFormData] = useState(viewsSettingsPlaceholder);
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
      try {
        await postView(formData);
      } catch (error) {
        emitError(`Error view settings: ${error}`);
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
   * @param {(string | number | boolean)} value - new object parameter value
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
        Options related to the timer styling
        <br />
        🔥 Changes take effect on save 🔥
      </p>
      <form onSubmit={submitHandler}>
        <div className={style.modalFields}>
          <div className={style.modalInline}>
            <div className={style.spacedEntry}>
              <FormLabel htmlFor='normalColor'> Normal Color </FormLabel>
              <PopoverPicker
                name='normalColor'
                color={formData.normalColor}
                onChange={(event) => handleChange('normalColor', event)}
              ></PopoverPicker>
            </div>
            <div className={style.spacedEntry}>
              <FormLabel htmlFor='warningColor'> Warning Color </FormLabel>
              <PopoverPicker
                name='warningColor'
                color={formData.warningColor}
                onChange={(event) => handleChange('warningColor', event)}
              ></PopoverPicker>
            </div>
            <div className={style.spacedEntry}>
              <FormLabel htmlFor='dangerColor'> Danger Color </FormLabel>
              <PopoverPicker
                name='dangerColor'
                color={formData.dangerColor}
                onChange={(event) => handleChange('dangerColor', event)}
              ></PopoverPicker>
            </div>
          </div>
          <div className={style.modalInline}>
            <div className={style.spacedEntry}>
              <FormLabel htmlFor='warningThreshold'>Warning Thershold</FormLabel>
              <Input
                {...inputProps}
                name='warningThreshold'
                value={formData.warningThreshold}
                onChange={(event) => handleChange('warningThreshold', event.target.value)}
              />
            </div>
             <div className={style.spacedEntry}>
              <FormLabel htmlFor='dangerThreshold'>Danger Thershold</FormLabel>
              <Input
                {...inputProps}
                name='dangerThreshold'
                value={formData.dangerThreshold}
                onChange={(event) => handleChange('dangerThreshold', event.target.value)}
              />
            </div>
          </div>
          <SubmitContainer revert={revert} submitting={submitting} changed={changed} status={status} />
        </div>
      </form>
    </ModalBody>
  );
}
