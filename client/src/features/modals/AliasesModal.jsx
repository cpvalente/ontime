/* eslint-disable jsx-a11y/anchor-has-content */
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Button, IconButton } from '@chakra-ui/button';
import { ModalBody } from '@chakra-ui/modal';
import { Input } from '@chakra-ui/react';
import { Tooltip } from '@chakra-ui/tooltip';
import { IoInformationCircleOutline } from '@react-icons/all-files/io5/IoInformationCircleOutline';
import { IoRemove } from '@react-icons/all-files/io5/IoRemove';
import { IoSunny } from '@react-icons/all-files/io5/IoSunny';
import { ALIASES } from 'app/api/apiConstants';
import { useFetch } from 'app/hooks/useFetch';

import { getAliases, postAliases } from '../../app/api/ontimeApi';
import { viewerLocations } from '../../app/appConstants';
import { LoggingContext } from '../../app/context/LoggingContext';
import { validateAlias } from '../../app/utils/aliases';
import { handleLinks, host } from '../../common/utils/linkUtils';

import SubmitContainer from './SubmitContainer';

import style from './Modals.module.scss';

export default function AliasesModal() {
  const { data, status, refetch } = useFetch(ALIASES, getAliases);
  const { emitError } = useContext(LoggingContext);
  const [changed, setChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aliases, setAliases] = useState([]);

  /**
   * Set formdata from server state
   */
  useEffect(() => {
    if (data == null) return;
    if (changed) return;
    setAliases([...data]);
  }, [changed, data]);

  /**
   * Validate and submit data
   */
  const submitHandler = useCallback(
    async (event) => {
      event.preventDefault();
      setSubmitting(true);

      const validatedAliases = [...aliases];
      let errors = false;
      for (const alias of validatedAliases) {
        // validate url
        const isURLValid = validateAlias(alias.pathAndParams);
        if (!isURLValid.status) {
          alias.urlError = isURLValid.message;
          errors = true;
        } else {
          alias.urlError = undefined;
        }
        // validate alias
        const isAliasValid = validateAlias(alias.alias);
        if (!isAliasValid.status) {
          alias.aliasError = isAliasValid.message;
          errors = true;
        } else {
          alias.aliasError = undefined;
        }
      }
      setAliases(validatedAliases);

      if (!errors) {
        await postAliases(aliases);
        await refetch();
        setChanged(false);
      }

      setSubmitting(false);
    },
    [aliases, refetch]
  );

  /**
   * Creates a new alias in state with a temporary id
   */
  const addNew = useCallback(() => {
    if (aliases.length > 20) {
      emitError('Maximum amount of aliases reacted (20)');
      return;
    }

    const emptyAlias = {
      id: Math.floor(Math.random() * 1000),
      enabled: false,
      alias: '',
      pathAndParams: '',
    };
    setAliases((prevState) => [...prevState, emptyAlias]);
    setChanged(true);
  }, [aliases.length, emitError]);

  /**
   * Deletes an alias by a given id
   * @param {string} id - id of alias to delete
   */
  const deleteAlias = useCallback((id) => {
    setAliases((prevState) => [...prevState.filter((a) => a.id !== id)]);
    setChanged(true);
  }, []);

  /**
   * Sets enabled flag to true / false
   * @param {string} id - object id
   * @param {boolean} isEnabled - whether to enable / disable flag
   */
  const setEnabled = useCallback((id, isEnabled) => {
    const aliasesState = [...aliases];
    for (const a of aliasesState) {
      if (a.id === id) {
        if (isEnabled) {
          if (a.alias === '' || a.pathAndParams === '') {
            emitError('Alias incomplete');
            break;
          }

          const isRepeated = aliases.some((r) => a.alias === r.alias && r.enabled);
          if (isRepeated) {
            emitError('There is already an alias with this name');
            break;
          }
        }
        a.enabled = isEnabled;
        break;
      }
    }
    setChanged(true);
    setAliases(aliasesState);
  }, [aliases, emitError]);

  /**
   * Reverts local state equals to server state
   */
  const revert = async () => {
    setChanged(false);
    await refetch();
  };

  /**
   * Handles change of input field in local state
   * @param {number} index - index of item in array
   * @param {string} field - object parameter to update
   * @param {string} value - new object parameter value
   */
  const handleChange = useCallback(
    (index, field, value) => {
      const temp = [...aliases];
      temp[index][field] = value;
      setAliases(temp);
      setChanged(true);
    },
    [aliases]
  );

  return (
    <ModalBody className={style.modalBody}>
      <p className={style.notes}>
        Configure easy to use URL Aliases
        <br />
        🔥 Changes take effect on save 🔥
      </p>
      <form onSubmit={submitHandler}>
        <div className={style.modalFields}>
          <div className={style.hSeparator}>Default URLs</div>
          <div className={style.blockNotes}>
            {viewerLocations.map((l) => (
              <a
                href={l.link}
                target='_blank'
                rel='noreferrer'
                className={style.flexNote}
                key={l.link}
                onClick={(e) => handleLinks(e, l.link)}
              >
                {`${l.label} - http://${host}/${l.link}`}
              </a>
            ))}
          </div>
          <div className={style.hSeparator}>Custom Aliases</div>
          <div className={style.blockNotes}>
            <span className={style.inlineFlex}>
              <IoInformationCircleOutline color='#2b6cb0' fontSize='2em' />
              URL aliases are useful in two main scenarios
            </span>
            <span className={style.labelNote}>Complicated URLs</span>
            <br />
            eg. a lower third url with some custom parameters
            <table>
              <tbody>
                <tr>
                  <td className={style.labelNote} style={{ width: '30%' }}>
                    Alias
                  </td>
                  <td className={style.labelNote}>Page URL</td>
                </tr>
                <tr>
                  <td>mylower</td>
                  <td>lower?bg=ff2&text=f00&size=0.6&transition=5</td>
                </tr>
              </tbody>
            </table>
            <br />
            <span className={style.labelNote}>URLs to be changed dynamically</span>
            <br />
            eg. an unattended screen that you would need to change route from the app
            <table>
              <tbody>
                <tr>
                  <td className={style.labelNote} style={{ width: '30%' }}>
                    Alias
                  </td>
                  <td className={style.labelNote}>Page URL</td>
                </tr>
                <tr>
                  <td>thirdfloor</td>
                  <td>public</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className={style.inlineAliasPlaceholder}>
            <span className={style.labelNote}>Alias</span>
            <span className={style.labelNote}>Page URL</span>
          </div>
          {aliases.map((alias, index) => (
            <div key={alias.id}>
              <div className={style.inlineAlias}>
                <Input
                  size='sm'
                  variant='flushed'
                  name='Alias'
                  placeholder='URL Alias'
                  autoComplete='off'
                  value={alias.alias}
                  isInvalid={alias.aliasError}
                  onChange={(event) => handleChange(index, 'alias', event.target.value)}
                />
                <Input
                  size='sm'
                  fontSize='0.75em'
                  variant='flushed'
                  name='URL'
                  placeholder='URL (portion after ontime Port)'
                  autoComplete='off'
                  value={alias.pathAndParams}
                  isInvalid={alias.urlError}
                  onChange={(event) => handleChange(index, 'pathAndParams', event.target.value)}
                />
                <Tooltip label={`Test /${alias.pathAndParams}`} openDelay={500}>
                  <a
                    href='#!'
                    target='_blank'
                    rel='noreferrer'
                    onClick={(e) => handleLinks(e, alias.pathAndParams)}
                  />
                </Tooltip>
                <Tooltip label='Enable alias' openDelay={500}>
                  <IconButton
                    aria-label='Enable alias'
                    size='xs'
                    icon={<IoSunny />}
                    colorScheme='blue'
                    variant={alias.enabled ? null : 'outline'}
                    onClick={() => setEnabled(alias.id, !alias.enabled)}
                  />
                </Tooltip>
                <Tooltip label='Delete alias' openDelay={500}>
                  <IconButton
                    aria-label='Delete alias'
                    size='xs'
                    icon={<IoRemove />}
                    colorScheme='red'
                    onClick={() => deleteAlias(alias.id)}
                  />
                </Tooltip>
              </div>
              {alias.aliasError ? (
                <div className={style.error}>{`Alias error: ${alias.aliasError}`}</div>
              ) : null}
              {alias.urlError ? (
                <div className={style.error}>{`URL error: ${alias.urlError}`}</div>
              ) : null}
            </div>
          ))}

          <div className={style.inlineAliasPlaceholder}>
            <Button size='xs' colorScheme='blue' variant='outline' onClick={() => addNew()}>
              Add new
            </Button>
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
