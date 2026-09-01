import { KeyboardEvent, useRef } from 'react';
import { IoClose, IoSearch } from 'react-icons/io5';

import IconButton from '../../../common/components/buttons/IconButton';
import Input from '../../../common/components/input/input/Input';

import style from './SettingsSearch.module.scss';

interface SettingsSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
}

export default function SettingsSearch({ query, onQueryChange, onSubmit }: SettingsSearchProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const isSearching = query.trim().length > 0;

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && isSearching) {
      // Do not let the settings panel close while the user is clearing a search.
      event.stopPropagation();
      onQueryChange('');
      return;
    }

    if (event.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <div className={style.search}>
      <IoSearch className={style.icon} />
      <Input
        ref={searchRef}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='Search settings'
        className={style.input}
        fluid
      />
      {isSearching && (
        <IconButton
          variant='ghosted-white'
          size='small'
          aria-label='Clear search'
          className={style.clear}
          onClick={() => {
            onQueryChange('');
            searchRef.current?.focus();
          }}
        >
          <IoClose />
        </IconButton>
      )}
    </div>
  );
}
