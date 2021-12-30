import { Button, IconButton } from '@chakra-ui/button';
import { FiPlus, FiMinus, FiInfo, FiSun } from 'react-icons/fi';
import { ModalBody } from '@chakra-ui/modal';
import { Input } from '@chakra-ui/react';
import { fetchEvent } from 'app/api/eventApi';
import { useContext, useState } from 'react';
import { useFetch } from 'app/hooks/useFetch';
import { EVENT_TABLE } from 'app/api/apiConstants';
import style from './Modals.module.scss';
import { viewerLinks } from '../../app/appConstants';
import { LoggingContext } from '../../app/context/LoggingContext';
import { validateAlias } from '../../app/utils/aliases';

const dynamicRoutes = [
  {
    id: 1,
    enabled: true,
    alias: 'testing',
    pathAndParams: 'lower?bg=ff2&text=f00&size=0.6&transition=5'
  },
  {
    id: 2,
    enabled: true,
    alias: 'testing2',
    pathAndParams: 'lower?bg=ff2&text=f00&size=0.6&transition=5'
  }
];

export default function AliasesModal() {
  const { emitError } = useContext(LoggingContext);
  const { data, status, isError } = useFetch(EVENT_TABLE, fetchEvent);
  const [changed, setChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aliases, setAliases] = useState(dynamicRoutes);

  const submitHandler = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    const validatedAliases = [...aliases];
    let errors = false;
    for (const alias of validatedAliases) {
      const isValid = validateAlias(alias.pathAndParams);
      if (!isValid.status) {
        alias.error = isValid.message;
        errors = true;
      } else {
        alias.error = undefined;
      }
    }
    console.log('setting aliases', validatedAliases);
    setAliases(validatedAliases);
    if (errors) {
      console.log('errors');
      // do nothing?
    } else {
      // submit logic
      console.log('noErrrors');

    }
    setChanged(false);
    setSubmitting(false);

  };

  /**
   * Creates a new alias in state with a temporary id
   */
  const addNew = () => {
    if (aliases.length > 20) {
      emitError('Maximum amount of aliases reacted (20)');
      return;
    }

    const emptyAlias = {
      id: Math.floor(Math.random() * 1000),
      enabled: false,
      alias: '',
      path: '',
      params: ''
    };
    setAliases(
      prevState => [...prevState, emptyAlias]
    );
  };

  /**
   * Deletes an alias by a given id
   * @param {string} id - id of alias to delete
   */
  const deleteAlias = (id) => {
    setAliases(prevState => [...prevState.filter((a) => a.id !== id)]);
  };

  /**
   * Sets enabled flag to true / false
   * @param {string} id - object id
   * @param {boolean} isEnabled - whether to enable / disable flag
   */
  const setEnabled = (id, isEnabled) => {
    const aliasesState = [...aliases];
    for (const a of aliasesState) {
      if (a.id === id) {
        if (isEnabled) {
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
    setAliases(aliasesState);
  };

  /**
   * Reverts local state equals to server state
   */
  const revert = () => {
    setAliases(dynamicRoutes);
    setChanged(false);
  };

  /**
   * Handles change of input field in local state
   * @param {number} index - index of item in array
   * @param {string} field - object parameter to update
   * @param {string} value - new object parameter value
   */
  const handleChange = (index, field, value) => {
    const temp = [...aliases];
    temp[index][field] = value;
    setAliases(temp);
    setChanged(true);
  };

  console.log(aliases);

  return (
    <>
      <ModalBody className={style.modalBody}>
        <p className={style.notes}>
          Configure easy to use URL Aliases<br />
          🔥 Changes take effect on save 🔥
        </p>
        <form onSubmit={submitHandler}>
          <div className={style.modalFields}>
            <div className={style.hSeparator}>Default URLs</div>
            <div className={style.blockNotes}>
              {viewerLinks.map((l) => (
                <a
                  href={l.link}
                  target='_blank'
                  rel='noreferrer'
                  className={style.flexNote}
                  key={l.link}
                >
                  {`${l.label} - ${l.link}`}
                </a>
              ))}
            </div>
            <div className={style.hSeparator}>
              Custom Aliases
            </div>
            <div className={style.blockNotes}>
              <span className={style.inlineFlex}><FiInfo color='#2b6cb0' fontSize={'2em'} />URL aliases are useful in two main scenarios</span>
              <span className={style.labelNote}>Complicated URLs</span><br />
              eg. a lower third url with some custom parameters
              <table>
                <tbody>
                <tr>
                  <td className={style.labelNote} style={{ width: '30%' }}>Alias</td>
                  <td className={style.labelNote}>Page URL</td>
                </tr>
                <tr>
                  <td>mylower</td>
                  <td>lower/?bg=ff2&text=f00&size=0.6&transition=5</td>
                </tr>
                </tbody>
              </table>
              <br />
              <span className={style.labelNote}>URLs to be changed dynamically</span><br />
              eg. an unattended screen that you would need to change route from the app
              <table>
                <tbody>
                <tr>
                  <td className={style.labelNote} style={{ width: '30%' }}>Alias</td>
                  <td className={style.labelNote}>Page URL</td>
                </tr>
                <tr>
                  <td>thirdfloor</td>
                  <td>public</td>
                </tr>
                </tbody>
              </table>
            </div>
            <div className={style.inlineAliasPlaceholder} style={{ padding: '0.5em 0' }}>
              <span className={style.labelNote}>Alias</span>
              <span className={style.labelNote}>Page URL</span>
              <IconButton
                size='xs'
                icon={<FiPlus />}
                colorScheme='blue'
                variant='outline'
                onClick={() => addNew()}
              />
            </div>
            {aliases.map((d, index) => (
              <>
                <div className={style.inlineAlias} key={d.id}>
                  <Input
                    size='sm'
                    variant='flushed'
                    name='Alias'
                    placeholder='URL Alias'
                    autoComplete='off'
                    value={d.alias}
                    onChange={(event) => handleChange(index, 'alias', event.target.value)}
                  />
                  <Input
                    size='sm'
                    fontSize={'0.75em'}
                    variant='flushed'
                    name='URL'
                    placeholder='URL (portion after ontime Port)'
                    autoComplete='off'
                    value={d.pathAndParams}
                    isInvalid={d.error}
                    onChange={(event) => handleChange(index, 'pathAndParams', event.target.value)}
                  />
                  <IconButton
                    size='xs'
                    icon={<FiSun />}
                    colorScheme='blue'
                    variant={d.enabled ? null : 'outline'}
                    onClick={() => setEnabled(d.id, !d.enabled)}
                  />
                  <IconButton
                    size='xs'
                    icon={<FiMinus />}
                    colorScheme='red'
                    onClick={() => deleteAlias(d.id)}
                  />
                </div>
                {d.error ? <span className={style.error}>{d.error}</span> : null}
              </>
            ))}
          </div>
          <div className={style.submitContainer}>
            <Button
              type='submit'
              isDisabled={submitting || !changed}
              variant='ghosted'
              onClick={() => revert()}
            >
              Revert
            </Button>
            <Button
              colorScheme='blue'
              type='submit'
              isLoading={submitting}
              disabled={!changed}
            >
              Save
            </Button>
          </div>
        </form>
      </ModalBody>
    </>
  );
}
