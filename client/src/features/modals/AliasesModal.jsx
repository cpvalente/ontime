import { IconButton } from '@chakra-ui/button';
import { FiPlus, FiMinus } from 'react-icons/fi';
import { ModalBody } from '@chakra-ui/modal';
import { Input } from '@chakra-ui/react';
import { fetchEvent } from 'app/api/eventApi';
import { useState } from 'react';
import { useFetch } from 'app/hooks/useFetch';
import { EVENT_TABLE } from 'app/api/apiConstants';
import style from './Modals.module.css';

export default function AliasesModal() {
  const { data, status, isError } = useFetch(EVENT_TABLE, fetchEvent);
  const [submitting, setSubmitting] = useState(false);

  const submitHandler = async (event) => {
    event.preventDefault();
    // NOTHING HERE YET
  };

  // Hardcoded links for now
  // it will need dynamic PORT assignment
  const speakerLink = 'http://localhost:4001/speaker';
  const smLink = 'http://localhost:4001/sm';
  const publicLink = 'http://localhost:4001/public';
  const pipLink = 'http://localhost:4001/pip';

  return (
    <>
      <form onSubmit={submitHandler}>
        <ModalBody className={style.modalBody}>
          <p className={style.notes}>
            Configure easy to use URL Aliases
            <br />
            !!! Feature is not yet implemented !!!
          </p>

          <span> Default URLs </span>

          <div className={style.highNotes}>
            <p className={style.flexNote}>
              Presenter Screen <br />
              <a
                href={speakerLink}
                target='_blank'
                rel='noreferrer'
                className={style.label}
              >
                {speakerLink}
              </a>
            </p>
            <p className={style.flexNote}>
              Backstage / Stage Manager Screen <br />
              <a
                href={smLink}
                target='_blank'
                rel='noreferrer'
                className={style.label}
              >
                {smLink}
              </a>
            </p>
            <p className={style.flexNote}>
              Public / Foyer Screen <br />
              <a
                href={publicLink}
                target='_blank'
                rel='noreferrer'
                className={style.label}
              >
                {publicLink}
              </a>
            </p>
            <p className={style.flexNote}>
              Picture in Picture Screen <br />
              <a
                href={pipLink}
                target='_blank'
                rel='noreferrer'
                className={style.label}
              >
                {pipLink}
              </a>
            </p>
          </div>

          <span> Manage custom aliases</span>
          <div className={style.modalInline}>
            <Input
              size='sm'
              name='URL'
              placeholder='A long URL'
              autoComplete='off'
              value={'A long URL'}
              onChange={(event) => {
                // Nothing here yet
              }}
              isDisabled={true}
            />
            <Input
              size='sm'
              name='Alias'
              placeholder='A nice alias'
              autoComplete='off'
              value={'A nice alias'}
              onChange={(event) => {
                // Nothing here yet
              }}
              isDisabled={true}
            />
            <IconButton
              size='sm'
              icon={<FiMinus />}
              colorScheme='red'
              disabled
            />
          </div>
          <div className={style.separator} />
          <div className={style.modalInline}>
            <Input
              size='sm'
              name='URL'
              placeholder='URL'
              autoComplete='off'
              value={'URL'}
              onChange={(event) => {
                // Nothing here yet
              }}
              isDisabled={true}
            />
            <Input
              size='sm'
              name='Alias'
              placeholder='Alias'
              autoComplete='off'
              value={'Alias'}
              onChange={(event) => {
                // Nothing here yet
              }}
              isDisabled={true}
            />
            <IconButton
              size='sm'
              icon={<FiPlus />}
              colorScheme='blue'
              disabled
            />
          </div>
        </ModalBody>
      </form>
    </>
  );
}
