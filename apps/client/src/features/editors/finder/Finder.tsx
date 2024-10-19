import { KeyboardEvent, useState } from 'react';
import { Input, Modal, ModalBody, ModalContent, ModalFooter, ModalOverlay } from '@chakra-ui/react';
import { useDebouncedCallback } from '@mantine/hooks';
import { isOntimeEvent, SupportedEvent } from 'ontime-types';

import { useEventSelection } from '../../rundown/useEventSelection';

import useFinder from './useFinder';

import style from './Finder.module.scss';

interface FinderProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Finder(props: FinderProps) {
  const { isOpen, onClose } = props;
  const { find, results, error } = useFinder();
  const [selected, setSelected] = useState<number>(0);

  const setSelectedEvents = useEventSelection((state) => state.setSelectedEvents);
  const debouncedFind = useDebouncedCallback(find, 100);

  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    // all operations need results
    if (results.length === 0) {
      return;
    }
    if (event.key === 'ArrowDown') {
      setSelected((prev) => (prev + 1) % results.length);
    }
    if (event.key === 'ArrowUp') {
      setSelected((prev) => (prev - 1 + results.length) % results.length);
    }
    if (event.key === 'Enter') {
      const selectedEvent = results[selected];
      setSelectedEvents({ id: selectedEvent.id, index: selectedEvent.index, selectMode: 'click' });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant='ontime'>
      <ModalOverlay />
      <ModalContent maxWidth='40vw'>
        <ModalBody onKeyDown={navigate}>
          <Input size='lg' onChange={debouncedFind} variant='ontime-filled' placeholder='Search...' />
          <ul>
            {error && <li className={style.error}>{error}</li>}
            {results.length === 0 && <li className={style.empty}>No results</li>}
            {results.length > 0 &&
              results.map((event, index) => {
                const isSelected = selected === index;
                const displayIndex = event.type === SupportedEvent.Block ? '-' : event.index;
                const colour = event.type === SupportedEvent.Event ? event.colour : '';

                return (
                  <li key={event.id} className={style.entry} data-selected={isSelected}>
                    <div className={style.data}>
                      <div className={style.index} style={{ '--color': colour }}>
                        {displayIndex}
                      </div>
                      {isOntimeEvent(event) && <div className={style.cue}>{event.cue}</div>}
                      <div className={style.title}>{event.title}</div>
                    </div>
                    {isSelected && <span>Go ⏎</span>}
                  </li>
                );
              })}
          </ul>
        </ModalBody>
        <ModalFooter className={style.footer}>
          Use the keywords <span className={style.em}>cue</span>, <span className={style.em}>index</span> or
          <span className={style.em}>title</span> to filter search
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
