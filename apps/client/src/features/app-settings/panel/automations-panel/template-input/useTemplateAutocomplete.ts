import { Autocomplete as BaseAutocomplete } from '@base-ui/react/autocomplete';
import { useCallback, useMemo, useState, type RefObject } from 'react';

import { completeTemplateAtCursor, selectActiveTemplate } from './templateInput.utils';

type TemplateElement = HTMLInputElement | HTMLTextAreaElement;

function getCursorIndex(element: TemplateElement | null, fallback: string) {
  return element?.selectionStart ?? fallback.length;
}

function focusCursor(element: TemplateElement | null, cursorIndex: number) {
  requestAnimationFrame(() => {
    element?.focus();
    element?.setSelectionRange(cursorIndex, cursorIndex);
  });
}

export function useTemplateAutocomplete<T extends TemplateElement>(
  value: string,
  autocompleteList: string[],
  elementRef: RefObject<T | null>,
  onValueChange: (value: string) => void,
) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursor, setCursor] = useState(value.length);

  const activeTemplate = selectActiveTemplate(value, cursor);
  const suggestions = useMemo(() => {
    if (!activeTemplate) {
      return [];
    }
    return autocompleteList.filter((suggestion) => suggestion.startsWith(activeTemplate));
  }, [activeTemplate, autocompleteList]);

  const setCursorForValue = useCallback((nextValue: string, cursorIndex: number) => {
    setCursor(cursorIndex);
    setShowSuggestions(Boolean(selectActiveTemplate(nextValue, cursorIndex)));
  }, []);

  const updateCursor = useCallback(() => {
    const cursorIndex = getCursorIndex(elementRef.current, value);
    setCursorForValue(value, cursorIndex);
  }, [elementRef, setCursorForValue, value]);

  const handleValueChange = useCallback(
    (nextValue: string, eventDetails: BaseAutocomplete.Root.ChangeEventDetails) => {
      if (eventDetails.reason === 'item-press') {
        eventDetails.cancel();
        const completed = completeTemplateAtCursor(value, nextValue, cursor);
        setCursorForValue(completed.value, completed.cursorIndex);
        onValueChange(completed.value);
        focusCursor(elementRef.current, completed.cursorIndex);
        return;
      }

      const cursorIndex = getCursorIndex(elementRef.current, nextValue);
      setCursorForValue(nextValue, cursorIndex);
      onValueChange(nextValue);
    },
    [cursor, elementRef, onValueChange, setCursorForValue, value],
  );

  return {
    handleValueChange,
    open: showSuggestions && suggestions.length > 0,
    setCursorForValue,
    setShowSuggestions,
    suggestions,
    updateCursor,
  };
}
