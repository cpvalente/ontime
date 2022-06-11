import React, { useCallback, useEffect, useState } from 'react';
import { ModalBody } from '@chakra-ui/modal';
import { Input } from '@chakra-ui/react';
import { IoInformationCircleOutline } from '@react-icons/all-files/io5/IoInformationCircleOutline';
import { USERFIELDS } from 'app/api/apiConstants';
import { useFetch } from 'app/hooks/useFetch';

import { getUserFields, postUserFields, userFieldsPlaceholder } from '../../app/api/ontimeApi';
import { handleLinks, host } from '../../common/utils/linkUtils';

import SubmitContainer from './SubmitContainer';

import style from './Modals.module.scss';

export default function TableOptionsModal() {
  const { data, status, refetch } = useFetch(USERFIELDS, getUserFields);
  const [changed, setChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userFields, setUserFields] = useState(userFieldsPlaceholder);

  /**
   * Set formdata from server state
   */
  useEffect(() => {
    if (data == null) return;
    if (changed) return;
    // Todo: we need some validation on API replies
    setUserFields(data);
  }, [changed, data]);

  /**
   * Validate and submit data
   */
  const submitHandler = useCallback(async (event) => {
    event.preventDefault();
    setSubmitting(true);

    // validation step makes clean string
    const validatedFields = { ...userFields };
    const errors = false;
    for (const field in validatedFields) {
      validatedFields[field] = validatedFields[field].trim();
    }

    if (!errors) {
      await postUserFields(validatedFields);
      await refetch();
      setChanged(false);
    }

    setSubmitting(false);
  },[refetch, userFields]);

  /**
   * Reverts local state equals to server state
   */
  const revert = useCallback(async () => {
    setChanged(false);
    await refetch();
  },[refetch]);

  /**
   * Handles change of input field in local state
   * @param {string} field - object parameter to update
   * @param {string} value - new object parameter value
   */
  const handleChange = useCallback((field, value) => {
    if (value.length < 30) {
      const temp = { ...userFields };
      temp[field] = value;
      setUserFields(temp);
      setChanged(true);
    }
  },[userFields]);

  return (
    <ModalBody className={style.modalBody}>
      <p className={style.notes}>
        Options related to cuesheets
        <br />
        🔥 Changes take effect on save 🔥
      </p>
      <form onSubmit={submitHandler}>
        <div className={style.modalFields}>
          <div className={style.hSeparator}>User Fields</div>
          <div className={style.blockNotes}>
            <span className={style.inlineFlex}>
              <IoInformationCircleOutline color='#2b6cb0' fontSize='2em' />
              User Fields
            </span>
            <span>
              Userfields facilitate adding custom fields to an event (eg: light, sound, camera).{' '}
              <br />
              These are available for excel imports and shown in the{' '}
              <a
                target='_blank'
                rel='noreferrer'
                href={`http://${host}cuesheet`}
                onClick={(e) => handleLinks(e, 'cuesheet')}
              >
                cuesheet
              </a>
            </span>
          </div>
          <div className={style.inlineAliasPlaceholder} style={{ padding: '0.5em 0' }}>
            <span className={style.labelNote}>User Field</span>
            <span className={style.labelNote}>Display Name</span>
          </div>
          {Object.keys(userFields).map((field) => (
            <div className={style.inlineAlias} key={field}>
              <span>{field}</span>
              <Input
                size='sm'
                variant='flushed'
                name='Alias'
                placeholder={field}
                autoComplete='off'
                value={userFields[field]}
                onChange={(event) => handleChange(field, event.target.value)}
              />
            </div>
          ))}
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
