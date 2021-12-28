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

const dynamicRoutes = [
  {
    id: 1,
    enabled: true,
    alias: '/testing',
    path: '/lower',
    params: '?bg=ff2&text=f00&size=0.6&transition=5'
  },
  {
    id: 2,
    enabled: true,
    alias: '/testing2',
    path: '/lower',
    params: '?bg=ff2&text=f00&size=0.6&transition=5'
  }
];

export default function AliasesModal() {
  const { emitError } = useContext(LoggingContext);
  const { data, status, isError } = useFetch(EVENT_TABLE, fetchEvent);
  const [submitting, setSubmitting] = useState(false);
  const [aliases, setAliases] = useState(dynamicRoutes);

  const submitHandler = async (event) => {
    event.preventDefault();
    // NOTHING HERE YET
  };

  const validate = (input) => {
    // remove any portions before / like localhost:4001/IWANTTHIS
    // aliases cannot be the same
    // URLs cannot be the same
    // cannot use around /editor
    // cap to like 20 URLs
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
  };

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
                  <td>/mylower</td>
                  <td>/lower/?bg=ff2&text=f00&size=0.6&transition=5</td>
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
                  <td>/thirdfloor</td>
                  <td>/public</td>
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
            {aliases.map((d) => (
              <div className={style.inlineAlias} key={d.id}>
                <Input
                  size='sm'
                  variant='flushed'
                  name='Alias'
                  placeholder='URL Alias'
                  autoComplete='off'
                  value={d.alias}
                  onChange={(event) => {
                    // Nothing here yet
                  }}
                />
                <Input
                  size='sm'
                  fontSize={'0.75em'}
                  variant='flushed'
                  name='URL'
                  placeholder='URL (portion after ontime Port)'
                  autoComplete='off'
                  value={`${d.path}/${d.params}`}
                  onChange={(event) => {
                    // Nothing here yet
                  }}
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
            ))}
          </div>
        </form>
        <div className={style.submitContainer}>
          <Button
            type='submit'
            isLoading={submitting}
            variant='ghosted'
            onClick={() => revert()}
          >
            Revert
          </Button>
          <Button
            colorScheme='blue'
            type='submit'
            isLoading={submitting}
            disabled={true}
            onClick={() => validate()}
          >
            Save
          </Button>
        </div>
      </ModalBody>
    </>
  );
}
