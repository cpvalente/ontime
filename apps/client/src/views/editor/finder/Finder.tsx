import { KeyboardEvent, useState } from 'react';
import { useDebouncedCallback } from '@mantine/hooks';
import { SupportedEntry } from 'ontime-types';

import { useEventSelection } from '../../../features/rundown/useEventSelection';
import Modal from '../../../common/components/modal/Modal';
import Input from '../../../common/components/input/input/Input';

import useFinder from './useFinder';

import style from './Finder.module.scss';

interface FinderProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Finder(props: FinderProps) {
  const { isOpen, onClose } = props;
  const { find, results, error } = useFinder();
  const [selected, setSelected] = useState(0);

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
      submit();
    }
  };

  const submit = () => {
    const selectedEvent = results[selected];
    setSelectedEvents({ id: selectedEvent.id, index: selectedEvent.index, selectMode: 'click' });
    onClose();
  };

  const handleMouseMoveEvent = (event: React.MouseEvent<HTMLUListElement>) => {
    const target = event.target as HTMLElement;
    const li = target.closest('li');
    if (li) {
      const index = Number(li.dataset.index);
      if (!isNaN(index)) {
        setSelected(index);
      }
    }
  };

  const bodyElements = (
    <div onKeyDown={navigate}>
      <Input
        height='large' // Assuming 'lg' corresponds to 'large'
        onChange={(e) => debouncedFind(e.target.value)}
        variant='subtle' // Assuming 'ontime-filled' corresponds to 'subtle'
        placeholder='Search...'
        autoFocus // Retain autoFocus
      />
      <ul className={style.scrollContainer} onMouseMove={handleMouseMoveEvent}>
        {error && <li className={style.error}>{error}</li>}
        {results.length === 0 && <li className={style.empty}>No results</li>}
        {results.length > 0 &&
          results.map((entry, index) => {
            const isSelected = selected === index;
            const displayIndex = entry.type === SupportedEntry.Event ? entry.eventIndex : '-';
            const displayCue = entry.type === SupportedEntry.Event ? entry.cue : '';
            const colour = entry.type === SupportedEntry.Event ? entry.colour : '';

            return (
              <li
                key={entry.id}
                className={style.entry}
                data-selected={isSelected}
                data-index={index}
                onClick={submit}
              >
                <div className={style.data}>
                  <div className={style.index} style={{ '--color': colour }}>
                    {displayIndex}
                  </div>
                  <div className={style.cue}>{displayCue}</div>
                  <div className={style.title}>{entry.title}</div>
                </div>
                {isSelected && <span>Go ⏎</span>}
              </li>
            );
          })}
      </ul>
    </div>
  );

  const footerElements = (
    <div className={style.footer}>
      Use the keywords <span className={style.em}>cue</span>, <span className={style.em}>index</span> or
      <span className={style.em}>title</span> to filter search
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      title='Finder' // Or some other appropriate title, original had no explicit title
      onClose={onClose}
      bodyElements={bodyElements}
      footerElements={footerElements}
      showCloseButton // Typically good to have a close button
      // maxWidth='max(640px, 40vw)' // Needs to be handled by Modal's styling or wrapper
    />
  );
}
