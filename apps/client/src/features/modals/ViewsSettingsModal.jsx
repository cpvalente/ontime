import { useCallback, useEffect, useState } from 'react';
import { FormControl, FormLabel, ModalBody } from '@chakra-ui/react';
import { IoCheckmarkSharp } from '@react-icons/all-files/io5/IoCheckmarkSharp';
import { IoInformationCircleOutline } from '@react-icons/all-files/io5/IoInformationCircleOutline';

import { useEmitLog } from '@/common/stores/logger';

import { postView } from '../../common/api/ontimeApi';
import EnableBtn from '../../common/components/buttons/EnableBtn';
import PopoverPicker from '../../common/components/input/color-picker-input/PopoverPicker';
import useViewSettings from '../../common/hooks-query/useViewSettings';
import { viewsSettingsPlaceholder } from '../../common/models/ViewSettings.type';
import { openLink } from '../../common/utils/linkUtils';

import SubmitContainer from './SubmitContainer';

import style from './Modals.module.scss';

export default function ViewsSettingsModal() {
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
        Options related to the viewers
        <br />
        🔥 Changes take effect immediately 🔥
      </p>
      <form onSubmit={submitHandler}>
        <div className={style.hSeparator}>Style Options</div>
        <div className={style.blockNotes}>
          <span className={style.inlineFlex}>
            <IoInformationCircleOutline color='#2b6cb0' fontSize='2em' />
            CSS Style Overrides
          </span>
          This feature allows user defined CSS to override the application stylesheets as a way to customise viewers
          appearance.
          <br />
          Currently the feature affects the following views
          <br />
          <ul className={style.featureList}>
            <li>
              <IoCheckmarkSharp /> Stage timer
            </li>
            <li>
              <IoCheckmarkSharp /> Clock
            </li>
            <li>
              <IoCheckmarkSharp /> Minimal timer
            </li>
            <li>
              <IoCheckmarkSharp /> Backstage screen
            </li>
            <li>
              <IoCheckmarkSharp /> Public screen
            </li>
            <li>
              <IoCheckmarkSharp /> Countdown
            </li>
          </ul>
          Read more about it in the documentation{' '}
          <a
            href='#!'
            onClick={() => openLink('https://cpvalente.gitbook.io/ontime/features/custom-styling')}
            className={style.if}
          >
            over at Gitbook
          </a>
        </div>
        <div className={style.modalFields}>
          <div className={style.modalInline}>
            <FormControl>
              <FormLabel htmlFor='overrideStyles'>
                Override CSS Styles
                <span className={style.labelNote}>
                  <br />
                  Enable / Disable override
                </span>
              </FormLabel>
              <EnableBtn
                active={formData.overrideStyles}
                text={formData.overrideStyles ? 'Style Override Enabled' : 'Style Override Disabled'}
                actionHandler={() => handleChange('overrideStyles', !formData.overrideStyles)}
              />
            </FormControl>
          </div>
          <SubmitContainer revert={revert} submitting={submitting} changed={changed} status={status} />
        </div>
      </form>
    </ModalBody>
  );
}
