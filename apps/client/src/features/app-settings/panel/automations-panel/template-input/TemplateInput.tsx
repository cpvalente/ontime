import { forwardRef, useMemo, useState } from 'react';
import { mergeRefs, useClickOutside } from '@mantine/hooks';

import Input, { type InputProps } from '../../../../../common/components/input/input/Input';
import useCustomFields from '../../../../../common/hooks-query/useCustomFields';

import { makeAutoCompleteList, matchRemaining, selectFromLastTemplate } from './templateInput.utils';

import style from './TemplateInput.module.scss';

interface TemplateInputProps extends InputProps {}

const TemplateInput = forwardRef(function TemplateInput(props: TemplateInputProps, ref) {
  const { value, onChange, ...rest } = props;
  const { data } = useCustomFields();
  const localRef = useClickOutside(() => setShowSuggestions(false));

  const autocompleteList = useMemo(() => {
    return makeAutoCompleteList(data);
  }, [data]);

  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const updateSuggestions = (value: string) => {
    const template = selectFromLastTemplate(value);
    return autocompleteList.filter((suggestion) => suggestion.startsWith(template));
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);

    if (event.target.value.endsWith('{')) {
      setShowSuggestions(true);
      setSuggestions(updateSuggestions(event.target.value));
    } else if (event.target.value === '' || event.target.value.endsWith('}}')) {
      setShowSuggestions(false);
    } else if (showSuggestions) {
      setSuggestions(updateSuggestions(event.target.value));
    }

    onChange?.(event);
  };

  const handleSuggestion = (value: string) => {
    setInputValue((prev) => {
      const remaining = matchRemaining(prev as string, value);
      return prev + remaining;
    });
    setShowSuggestions(false);
  };

  return (
    <div className={style.wrapper} ref={mergeRefs(localRef, ref)}>
      <Input value={inputValue} {...rest} onChange={handleInputChange} fluid />
      {showSuggestions && suggestions.length > 0 && (
        <ul className={style.suggestions}>
          {suggestions.map((suggestion) => (
            <li key={suggestion} onClick={() => handleSuggestion(suggestion)}>
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export default TemplateInput;
